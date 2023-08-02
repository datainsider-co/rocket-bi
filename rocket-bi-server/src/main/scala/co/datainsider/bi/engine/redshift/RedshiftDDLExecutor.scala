package co.datainsider.bi.engine.redshift

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.TimeUtils
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.schema.domain.TableType.TableType
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.{TableSchema, TableType}
import co.datainsider.schema.repository.DDLExecutor
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.{DbExecuteError, InternalError, UnsupportedError}

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

/**
  * created 2023-06-27 2:25 PM
  *
  * @author tvc12 - Thien Vi
  */
class RedshiftDDLExecutor(val client: JdbcClient) extends DDLExecutor with Logging {
  private val DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm:ss"
  private val DATE_PATTERN = "yyyy-MM-dd"

  override def existsDatabaseSchema(dbName: String): Future[Boolean] =
    Future {
      val listSchemaQuery = "SELECT schema_name FROM information_schema.schemata where schema_name = ?"
      client.executeQuery(listSchemaQuery, dbName)(_.next())
    }

  override def existTableSchema(dbName: String, tblName: String, expectedColumnNames: Seq[String]): Future[Boolean] =
    Future {
      val listTablesQuery =
        s"SELECT table_name FROM information_schema.tables WHERE table_schema = ? and table_name = ?"
      client.executeQuery(listTablesQuery, dbName, tblName)(_.next())
    }

  override def getDbNames(): Future[Seq[String]] =
    Future {
      val query = s"SELECT schema_name FROM information_schema.schemata"
      client.executeQuery(query)(rs => {
        val dbNames = scala.collection.mutable.ArrayBuffer[String]()

        while (rs.next()) {
          dbNames += rs.getString(1)
        }
        dbNames.toSeq
      })
    }

  override def dropDatabase(dbName: String): Future[Boolean] =
    Future {
      val query = s"DROP SCHEMA ${dbName} CASCADE"
      client.executeUpdate(query) >= 0
    }

  override def getTableNames(dbName: String): Future[Seq[String]] =
    Future {
      val query = s"SELECT table_name FROM information_schema.tables WHERE table_schema = ?"
      client.executeQuery(query, dbName)(rs => {
        val tableNames = scala.collection.mutable.ArrayBuffer[String]()

        while (rs.next()) {
          tableNames += rs.getString(1)
        }
        tableNames.toSeq
      })
    }

  override def scanTables(organizationId: Long, dbName: String): Future[Seq[TableSchema]] =
    Future {
      try {
        val tablesSchemas: Seq[TableSchema] = listTableSchemas(organizationId, dbName)
        tablesSchemas.map(tableSchema => {
          val columns = getColumns(dbName, tableSchema.name)
          tableSchema.copy(columns = columns)
        })
      } catch {
        case ex: Throwable => {
          throw InternalError(s"Scan database $dbName failed cause: ${ex.getMessage}", ex)
        }
      }
    }

  private def listTableSchemas(orgId: Long, dbName: String): Seq[TableSchema] = {
    val query =
      s"""SELECT tables.*, views.VIEW_DEFINITION
         |FROM information_schema.tables left join information_schema.views
         |on tables.TABLE_CATALOG = views.TABLE_CATALOG  and tables.TABLE_SCHEMA = views.TABLE_SCHEMA and tables.TABLE_NAME = views.TABLE_NAME
         |WHERE tables.table_schema = ? and tables.table_type in ('BASE TABLE', 'VIEW')
         |""".stripMargin

    client.executeQuery(query, dbName)((rs: ResultSet) => {
      val tableSchemas = ArrayBuffer[TableSchema]()
      while (rs.next()) {
        val tableType = rs.getString("table_type") match {
          case "BASE TABLE" => TableType.Default
          case "VIEW"       => TableType.View
          case _            => null
        }
        tableSchemas += TableSchema(
          organizationId = orgId,
          dbName = dbName,
          name = rs.getString("table_name"),
          displayName = rs.getString("table_name"),
          tableType = Option(tableType),
          engine = None,
          query = Option(rs.getString("view_definition")),
          columns = Seq.empty
        )
      }
      tableSchemas
    })
  }

  private def getColumns(dbName: String, tblName: String): Seq[Column] = {
    val listColumnsQuery =
      s"""
         |select * 
         |from information_schema.columns
         |where table_schema = ? and table_name = ?
         |""".stripMargin

    client.executeQuery(listColumnsQuery, dbName, tblName)(rs => {
      val columns = ArrayBuffer[Column]()
      while (rs.next()) {
        val columnName: String = rs.getString("column_name")
        val columnType: String = rs.getString("data_type")
        val defaultValue: Option[String] = Option(rs.getString("column_default"))
        val isNullable: Boolean = rs.getString("is_nullable") == "YES"
        val column = RedshiftUtils.toColumn(columnName, columnType, isNullable, defaultValue)
        columns += column
      }
      columns
    })
  }

  override def dropTable(dbName: String, tblName: String): Future[Boolean] =
    Future {
      val query = s"DROP TABLE ${dbName}.${tblName} CASCADE"
      client.executeUpdate(query) >= 0
    }

  override def dropTable(dbName: String, tblName: String, tableType: TableType): Future[Boolean] =
    Future {
      val sql = tableType match {
        case TableType.View | TableType.EtlView => s"DROP VIEW $dbName.$tblName"
        case _                                  => s"DROP TABLE $dbName.$tblName"
      }
      client.executeUpdate(sql) >= 0
    }

  override def getColumnNames(dbName: String, tblName: String): Future[Set[String]] =
    Future {
      val query =
        s"""
           |SELECT column_name
           |FROM information_schema.columns 
           |WHERE table_schema = ? AND table_name = ?
           |""".stripMargin
      client.executeQuery(query, dbName, tblName)(rs => {
        val columnNames = scala.collection.mutable.Set[String]()

        while (rs.next()) {
          columnNames += rs.getString(1)
        }
        columnNames.toSet
      })
    }

  override def createDatabase(dbName: String): Future[Boolean] =
    Future {
      val query = s"""CREATE SCHEMA ${dbName}"""
      client.executeUpdate(query) >= 0
    }

  override def createTable(tableSchema: TableSchema): Future[Boolean] =
    Future {
      tableSchema.getTableType match {
        case TableType.Default => createDefaultTable(tableSchema)
        case TableType.View    => createViewTable(tableSchema)
        case TableType.EtlView => createViewTable(tableSchema)
        case _                 => throw UnsupportedError(s"Unsupported table type ${tableSchema.getTableType}")
      }
    }

  private def createDefaultTable(tableSchema: TableSchema): Boolean = {
    val query = s"""CREATE TABLE ${tableSchema.dbName}.${tableSchema.name} (
                   | ${toMultiColumnDDL(tableSchema.columns)}
                   |)
                   |""".stripMargin
    logger.info(s"Create table query: $query")

    client.executeUpdate(query) >= 0
  }

  private def createViewTable(tableSchema: TableSchema): Boolean = {
    val query =
      s"""CREATE VIEW ${tableSchema.dbName}.${tableSchema.name} AS
         | ${tableSchema.query.getOrElse("")}
         |""".stripMargin
    logger.info(s"Create view query: $query")

    client.executeUpdate(query) >= 0
  }

  private def toMultiColumnDDL(columns: Seq[Column]): String = {
    columns
      .map(col => col.name + " " + toColumnDDLExpr(col))
      .mkString(",\n")
  }

  private def toColumnDDLExpr(
      column: Column,
      includeDefaultValue: Boolean = true,
      includeNullable: Boolean = true
  ): String = {
    val columnExpr: String = toColumnTypeExpr(column)

    (includeDefaultValue, includeNullable) match {
      case (true, true) =>
        s"$columnExpr ${toNullableDDL(column.isNullable)} ${toDefaultValueDDL(column)}"
      case (true, false)  => s"$columnExpr ${toDefaultValueDDL(column)}"
      case (false, true)  => s"$columnExpr ${toNullableDDL(column.isNullable)}"
      case (false, false) => columnExpr
    }
  }

  private def toColumnTypeExpr(column: Column): String = {
    column match {
      case col: BoolColumn       => s"boolean"
      case col: Int8Column       => s"smallint"
      case col: Int16Column      => s"integer"
      case col: Int32Column      => s"integer"
      case col: Int64Column      => s"bigint"
      case col: UInt8Column      => s"smallint"
      case col: UInt16Column     => s"integer"
      case col: UInt32Column     => s"integer"
      case col: UInt64Column     => s"bigint"
      case col: FloatColumn      => s"float"
      case col: DoubleColumn     => s"double precision"
      case col: StringColumn     => s"text"
      case col: DateColumn       => s"date"
      case col: DateTimeColumn   => s"timestamp"
      case col: DateTime64Column => s"timestamp"
      case col: ArrayColumn      => s"text"
      case col: NestedColumn     => s"text"
      case _                     => throw UnsupportedError(s"Unsupported column type ${column.getClass}")
    }
  }

  private def toNullableDDL(nullable: Boolean): String = {
    if (nullable) {
      ""
    } else {
      "not null"
    }
  }

  private def toDefaultValueDDL(column: Column): String = {
    column match {
      case column: BoolColumn   => column.defaultValue.map(x => s"DEFAULT ${if (x) 1 else 0}").getOrElse("")
      case column: Int8Column   => column.defaultValue.map(x => s"DEFAULT $x").getOrElse("")
      case column: Int16Column  => column.defaultValue.map(x => s"DEFAULT $x").getOrElse("")
      case column: Int32Column  => column.defaultValue.map(x => s"DEFAULT $x").getOrElse("")
      case column: Int64Column  => column.defaultValue.map(x => s"DEFAULT $x").getOrElse("")
      case column: UInt8Column  => column.defaultValue.map(x => s"DEFAULT $x").getOrElse("")
      case column: UInt16Column => column.defaultValue.map(x => s"DEFAULT $x").getOrElse("")
      case column: UInt32Column => column.defaultValue.map(x => s"DEFAULT $x").getOrElse("")
      case column: UInt64Column => column.defaultValue.map(x => s"DEFAULT $x").getOrElse("")
      case column: FloatColumn  => column.defaultValue.map(x => s"DEFAULT $x").getOrElse("")
      case column: DoubleColumn => column.defaultValue.map(x => s"DEFAULT $x").getOrElse("")
      // todo: text type cannot have default value
      case column: StringColumn => ""
      case column: DateColumn =>
        column.defaultValue.map(x => s"DEFAULT '${TimeUtils.format(x, DATE_PATTERN)}'").getOrElse("")
      case column: DateTimeColumn =>
        column.defaultValue.map(x => s"DEFAULT '${TimeUtils.format(x, DATE_TIME_PATTERN)}'").getOrElse("")
      case column: DateTime64Column =>
        column.defaultValue.map(x => s"DEFAULT '${TimeUtils.format(x, DATE_TIME_PATTERN)}'").getOrElse("")
      case _ => ""
    }
  }

  override def renameTable(dbName: String, oldTblName: String, newTblName: String): Future[Boolean] =
    Future {
      try {
        val query = s"ALTER TABLE ${dbName}.${oldTblName} RENAME TO ${newTblName}"
        client.executeUpdate(query) >= 0
      } catch {
        case ex: Throwable => throw InternalError(ex.getMessage, ex)
      }
    }

  override def addColumn(dbName: String, tblName: String, column: Column): Future[Boolean] =
    Future {
      try {
        val query = s"ALTER TABLE ${dbName}.${tblName} ADD COLUMN ${column.name} ${toColumnDDLExpr(column)}"
        client.executeUpdate(query) >= 0
      } catch {
        case ex: Throwable => throw InternalError(ex.getMessage, ex)
      }
    }

  override def addColumns(dbName: String, tblName: String, columns: Seq[Column]): Future[Boolean] = {
    require(columns.nonEmpty, "Columns cannot be empty")
    Future.collect(columns.map(column => addColumn(dbName, tblName, column))).map(a => a.contains(true))
  }

  override def updateColumn(dbName: String, tblName: String, column: Column): Future[Boolean] =
    Future {
      try {
        val query = s"ALTER TABLE ${dbName}.${tblName} ALTER COLUMN ${column.name} TYPE ${toColumnTypeExpr(column)}"
        client.executeUpdate(query) >= 0
      } catch {
        case ex: Throwable => throw InternalError(ex.getMessage, ex)
      }
    }

  override def dropColumn(dbName: String, tblName: String, columnName: String): Future[Boolean] =
    Future {
      try {
        val query = s"ALTER TABLE ${dbName}.${tblName} DROP COLUMN ${columnName}"
        client.executeUpdate(query) >= 0
      } catch {
        case ex: Throwable => throw InternalError(ex.getMessage, ex)
      }
    }

  override def detectColumns(query: String): Future[Seq[Column]] =
    Future {
      try {
        val finalQuery: String =
          s"""SELECT *
             |FROM ($query) as temp
             |WHERE 1 = 0""".stripMargin
        client.executeQuery(finalQuery)((rs: ResultSet) => RedshiftUtils.parseColumns(rs.getMetaData))
      } catch {
        case ex: Throwable => throw DbExecuteError(ex.getMessage, ex)
      }
    }

  override def migrateDataWithEncryption(
      sourceTable: TableSchema,
      destTable: TableSchema,
      encryptedColumnNames: Seq[String],
      decryptedColumns: Seq[String]
  ): Future[Boolean] = ???
}
