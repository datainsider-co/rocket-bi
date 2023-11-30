package co.datainsider.bi.engine.mysql

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.TimeUtils
import co.datainsider.schema.domain.TableType.TableType
import co.datainsider.schema.domain.column._
import co.datainsider.schema.domain.{TableSchema, TableType}
import co.datainsider.schema.repository.DDLExecutor
import com.mysql.cj.MysqlType
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.{DbExecuteError, InternalError, UnsupportedError}

import java.sql.{ResultSet, ResultSetMetaData}
import scala.collection.mutable.ArrayBuffer

/**
  * created 2023-06-27 2:25 PM
  *
  * @author tvc12 - Thien Vi
  */
class MysqlDDLExecutor(val client: JdbcClient) extends DDLExecutor with Logging {
  private val DATE_TIME_PATTERN = "yyyy-MM-dd HH:mm:ss"
  private val DATE_PATTERN = "yyyy-MM-dd"

  override def existsDatabaseSchema(dbName: String): Future[Boolean] =
    Future {
      client.executeQuery(s"SHOW DATABASES LIKE ?", dbName)(_.next())
    }

  override def existTableSchema(dbName: String, tblName: String, expectedColumnNames: Seq[String]): Future[Boolean] = {
    getColumnNames(dbName, tblName)
      .map(columnNames => {
        if (expectedColumnNames.nonEmpty) {
          expectedColumnNames.forall(columnNames.contains)
        } else {
          true
        }
      })
      .rescue {
        case e: Throwable => Future.False
      }
  }

  override def getDbNames(): Future[Seq[String]] =
    Future {
      val query = s"SHOW DATABASES"
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
      val query = s"DROP DATABASE IF EXISTS `${dbName}`"
      client.executeUpdate(query) >= 0
    }

  override def getTableNames(dbName: String): Future[Seq[String]] =
    Future {
      val query = s"SHOW TABLES FROM `${dbName}`"
      client.executeQuery(query)(rs => {
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
        val tableType = rs.getString("TABLE_TYPE") match {
          case "BASE TABLE" => TableType.Default
          case "VIEW"       => TableType.View
          case _            => null
        }
        tableSchemas += TableSchema(
          organizationId = orgId,
          dbName = dbName,
          name = rs.getString("TABLE_NAME"),
          displayName = rs.getString("TABLE_NAME"),
          tableType = Option(tableType),
          engine = Option(rs.getString("ENGINE")),
          query = Option(rs.getString("VIEW_DEFINITION")),
          columns = Seq.empty
        )
      }
      tableSchemas
    })
  }

  private def getColumns(dbName: String, tblName: String): Seq[Column] = {
    val query = s"SHOW COLUMNS FROM `${dbName}`.`${tblName}`"
    client.executeQuery(query)(rs => {
      val columns = ArrayBuffer[Column]()
      while (rs.next()) {
        val columnName: String = rs.getString("Field")
        val columnType: MysqlType = MysqlType.getByName(rs.getString("Type"))
        val defaultValue: Option[String] = Option(rs.getString("Default"))
        val isNullable: Boolean = rs.getString("Null") == "YES"
        val column = MysqlUtils.toColumn(columnName, columnType, isNullable, defaultValue)
        columns += column
      }
      columns
    })
  }

  override def dropTable(dbName: String, tblName: String): Future[Boolean] =
    Future {
      val query = s"DROP TABLE IF EXISTS `${dbName}`.`${tblName}`"
      client.executeUpdate(query) >= 0
    }

  override def dropTable(dbName: String, tblName: String, tableType: TableType): Future[Boolean] =
    Future {
      val dropTblQuery = tableType match {
        case TableType.View | TableType.EtlView => s"DROP VIEW IF EXISTS `${dbName}`.`${tblName}`"
        case _                                  => s"DROP TABLE IF EXISTS `${dbName}`.`${tblName}`"
      }
      client.executeUpdate(dropTblQuery) >= 0
    }

  override def getColumnNames(dbName: String, tblName: String): Future[Set[String]] =
    Future {
      val query = s"SHOW COLUMNS FROM `${dbName}`.`${tblName}`"
      client.executeQuery(query)(rs => {
        val columnNames = scala.collection.mutable.Set[String]()

        while (rs.next()) {
          columnNames += rs.getString(1)
        }
        columnNames.toSet
      })
    }

  override def createDatabase(dbName: String): Future[Boolean] =
    Future {
      val query = s"""CREATE DATABASE IF NOT EXISTS `${dbName}`"""
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
    val query = s"""CREATE TABLE IF NOT EXISTS `${tableSchema.dbName}`.`${tableSchema.name}` (
                   | ${toMultiColumnDDL(tableSchema.columns)}
                   |) ENGINE=${tableSchema.engine.getOrElse("InnoDB")}
                   |DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                   |""".stripMargin
    logger.info(s"Create table query: $query")

    client.executeUpdate(query) >= 0
  }

  private def createViewTable(tableSchema: TableSchema): Boolean = {
    val query =
      s"""CREATE VIEW `${tableSchema.dbName}`.`${tableSchema.name}` AS
         | ${tableSchema.query.getOrElse("")}
         |""".stripMargin
    logger.info(s"Create view query: $query")

    client.executeUpdate(query) >= 0
  }

  private def toMultiColumnDDL(columns: Seq[Column]): String = {
    columns
      .map(col => toColumnDDLExpr(col))
      .mkString(",\n")
  }

  private def toColumnDDLExpr(
      column: Column,
      includeDefaultValue: Boolean = true,
      includeNullable: Boolean = true
  ): String = {
    val columnExpr: String = column match {
      case col: BoolColumn   => s"`${col.name}` TINYINT(1)"
      case col: Int8Column   => s"`${col.name}` TINYINT(4)"
      case col: Int16Column  => s"`${col.name}` SMALLINT(6)"
      case col: Int32Column  => s"`${col.name}` INT(11)"
      case col: Int64Column  => s"`${col.name}` BIGINT(20)"
      case col: UInt8Column  => s"`${col.name}` TINYINT(4) UNSIGNED"
      case col: UInt16Column => s"`${col.name}` SMALLINT(6) UNSIGNED"
      case col: UInt32Column => s"`${col.name}` INT(11) UNSIGNED"
      case col: UInt64Column => s"`${col.name}` BIGINT(20) UNSIGNED"
      case col: FloatColumn  => s"`${col.name}` FLOAT"
      case col: DoubleColumn => s"`${col.name}` DOUBLE"
      case col: StringColumn => s"`${col.name}` LONGTEXT"
      case col: DateColumn   => s"`${col.name}` DATE"
      // todo: // Timezone information is lost in DATETIME columns
      case col: DateTimeColumn   => s"`${col.name}` DATETIME"
      case col: DateTime64Column => s"`${col.name}` DATETIME"
      case col: ArrayColumn      => s"`${col.name}` TEXT"
      case col: NestedColumn     => s"`${col.name}` TEXT"
      case _                     => throw UnsupportedError(s"Unsupported column type ${column.getClass}")
    }

    (includeDefaultValue, includeNullable) match {
      case (true, true) =>
        s"$columnExpr ${toNullableDDL(column.isNullable)} ${toDefaultValueDDL(column)}"
      case (true, false)  => s"$columnExpr ${toDefaultValueDDL(column)}"
      case (false, true)  => s"$columnExpr ${toNullableDDL(column.isNullable)}"
      case (false, false) => columnExpr
    }
  }

  private def toNullableDDL(nullable: Boolean): String = {
    if (nullable) {
      "NULL"
    } else {
      "NOT NULL"
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
        val query = s"RENAME TABLE `${dbName}`.`${oldTblName}` TO `${dbName}`.`${newTblName}`"
        client.executeUpdate(query) >= 0
      } catch {
        case ex: Throwable => throw InternalError(ex.getMessage, ex)
      }
    }

  override def addColumn(dbName: String, tblName: String, column: Column): Future[Boolean] =
    addColumns(dbName, tblName, Seq(column))

  override def addColumns(dbName: String, tblName: String, columns: Seq[Column]): Future[Boolean] =
    Future {
      require(columns.nonEmpty, "Columns cannot be empty")
      try {
        val addColumnQuery: String = columns.map(col => s"ADD COLUMN ${toColumnDDLExpr(col)}").mkString(",\n")
        val query = s"ALTER TABLE `${dbName}`.`${tblName}`" + addColumnQuery
        client.executeUpdate(query) >= 0
      } catch {
        case ex: Throwable => throw InternalError(ex.getMessage, ex)
      }
    }

  override def updateColumn(dbName: String, tblName: String, column: Column): Future[Boolean] =
    Future {
      try {
        val query = s"ALTER TABLE `${dbName}`.`${tblName}` MODIFY COLUMN ${toColumnDDLExpr(column)}"
        client.executeUpdate(query) >= 0
      } catch {
        case ex: Throwable => throw InternalError(ex.getMessage, ex)
      }
    }

  override def dropColumn(dbName: String, tblName: String, columnName: String): Future[Boolean] =
    Future {
      try {
        val query = s"ALTER TABLE `${dbName}`.`${tblName}` DROP COLUMN `${columnName}`"
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
           |FROM (
           | $query
           |) as temp
           |WHERE 1 = 0""".stripMargin
        client.executeQuery(finalQuery)((rs: ResultSet) => MysqlUtils.parseColumns(rs.getMetaData))
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
