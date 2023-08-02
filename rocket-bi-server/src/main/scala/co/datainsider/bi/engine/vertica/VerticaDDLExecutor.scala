package co.datainsider.bi.engine.vertica

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.Using
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.schema.domain.TableType.TableType
import co.datainsider.schema.domain.column.{Column, StringColumn}
import co.datainsider.schema.domain.{TableSchema, TableType}
import co.datainsider.schema.repository.DDLExecutor
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.{DbExecuteError, InternalError, UnsupportedError}

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

/**
  * created 2023-07-18 4:53 PM
  *
  * @author tvc12 - Thien Vi
  */
class VerticaDDLExecutor(client: JdbcClient, catalog: String) extends DDLExecutor with Logging {

  private val clazz = getClass.getSimpleName
  private val DEFAULT_TABLE_TYPE = "TABLE"
  private val VIEW_TABLE_TYPE = "VIEW"
  private val SYSTEM_TABLE_TYPE = "SYSTEM TABLE"

  private val SUPPORTED_TABLE_TYPES = Seq(DEFAULT_TABLE_TYPE, VIEW_TABLE_TYPE, SYSTEM_TABLE_TYPE)

  override def existsDatabaseSchema(dbName: String): Future[Boolean] = {
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::existsDatabaseSchema") {
        client.getDatabases(catalog).contains(dbName)
      }
    }
  }

  override def existTableSchema(dbName: String, tblName: String, expectedColNames: Seq[String]): Future[Boolean] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::existTableSchema") {
        val isExistedTable: Boolean =
          client.getTables(catalog, dbName, SUPPORTED_TABLE_TYPES).exists(table => table.equalsIgnoreCase(tblName))
        if (isExistedTable && expectedColNames.nonEmpty) {
          val actualColNames: Set[String] = client.getColumns(catalog, dbName, tblName).map(_.toLowerCase).toSet
          expectedColNames.forall(colName => actualColNames.contains(colName.toLowerCase))
        } else if (isExistedTable && expectedColNames.isEmpty) {
          true
        } else {
          false
        }
      }
    }

  override def getDbNames(): Future[Seq[String]] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::getDbNames") {
        client.getDatabases(catalog)
      }
    }

  override def dropDatabase(dbName: String): Future[Boolean] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::dropDatabase") {
        val sql = s"""DROP SCHEMA IF EXISTS "$dbName" CASCADE""";
        client.executeUpdate(sql) >= 0
      }
    }

  override def getTableNames(dbName: String): Future[Seq[String]] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::getTableNames") {
        client.getTables(catalog, dbName, SUPPORTED_TABLE_TYPES)
      }
    }

  override def scanTables(organizationId: Long, dbName: String): Future[Seq[TableSchema]] =
    Future {
      try {
        val query =
          s"""SELECT all_tables.*, view_definition
             |FROM v_catalog.all_tables LEFT JOIN v_catalog.views ON all_tables.table_id = views.table_id
             |WHERE schema_name = ?""".stripMargin
        val tables: Seq[TableSchema] = client.executeQuery(query, dbName)(toTableSchemas(organizationId, dbName, _))
        tables.map(table => {
          val columns: Seq[Column] = getColumns(dbName, table.name)
          table.copy(columns = columns)
        })
      } catch {
        case ex: Throwable => {
          throw InternalError(s"Scan database $dbName failed cause: ${ex.getMessage}", ex)
        }
      }
    }

  private def toTableSchemas(orgId: Long, dbName: String, rs: ResultSet): Seq[TableSchema] = {
    val tableSchemas = ArrayBuffer[TableSchema]()
    while (rs.next()) {
      val tableName: String = rs.getString("table_name")
      val tableType: TableType = rs.getString("table_type") match {
        case "TABLE" => TableType.Default
        case "VIEW"  => TableType.View
        case _       => null
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
  }

  private def getColumns(dbName: String, tblName: String): Seq[Column] = {
    Using(client.getConnection()) { conn =>
      val rs: ResultSet = conn.getMetaData.getColumns(catalog, dbName, tblName, null)
      val columnNames = ArrayBuffer.empty[Column]
      while (rs.next()) {
        val columnName: String = rs.getString("COLUMN_NAME")
        val isNullable: Boolean = rs.getString("IS_NULLABLE") == "YES"
        val colTypeId: Int = rs.getInt("DATA_TYPE")

        columnNames += VerticaUtils.toColumn(columnName, colTypeId, isNullable)
      }
      columnNames
    }
  }

  override def dropTable(dbName: String, tblName: String): Future[Boolean] =
    dropTable(dbName, tblName, TableType.Default)

  override def dropTable(dbName: String, tblName: String, tableType: TableType): Future[Boolean] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::dropTable") {
        val sql = tableType match {
          case TableType.View | TableType.EtlView => s"""DROP VIEW IF EXISTS "$dbName"."$tblName" """
          case _                                  => s"""DROP TABLE IF EXISTS "$dbName"."$tblName" """
        }
        client.executeUpdate(sql) >= 0
      }
    }

  override def getColumnNames(dbName: String, tblName: String): Future[Set[String]] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::getColumnNames") {
        client.getColumns(catalog, dbName, tblName).toSet
      }
    }

  override def createDatabase(dbName: String): Future[Boolean] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::createDatabase") {
        val sql = s"""CREATE SCHEMA IF NOT EXISTS "$dbName" """;
        client.executeUpdate(sql) >= 0
      }
    }

  override def createTable(tableSchema: TableSchema): Future[Boolean] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::createTable") {
        tableSchema.getTableType match {
          case TableType.Default => createDefaultTable(tableSchema)
          case TableType.View    => createViewTable(tableSchema)
          case TableType.EtlView => createViewTable(tableSchema)
          case _                 => throw UnsupportedError(s"Unsupported table type ${tableSchema.getTableType}")
        }
      }
    }

  private def createDefaultTable(tableSchema: TableSchema): Boolean = {
    val createSql =
      s"""CREATE TABLE IF NOT EXISTS "${tableSchema.dbName}"."${tableSchema.name}" (
         |  ${VerticaUtils.toMultiColumnDDL(tableSchema.columns)}
         |)""".stripMargin
    client.executeUpdate(createSql) >= 0
  }

  private def createViewTable(tableSchema: TableSchema): Boolean = {
    require(tableSchema.query.nonEmpty, "Query must be not empty")
    val createSql = s"""CREATE OR REPLACE VIEW "${tableSchema.dbName}"."${tableSchema.name}" AS
         |${tableSchema.query.get}""".stripMargin

    client.executeUpdate(createSql) >= 0
  }

  override def renameTable(dbName: String, oldTblName: String, newTblName: String): Future[Boolean] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::renameTable") {
        try {
          val sql = s"""ALTER TABLE "$dbName"."$oldTblName" RENAME TO "$newTblName" """;
          client.executeUpdate(sql) >= 0
        } catch {
          case ex: Throwable => {
            throw InternalError(s"Error when rename table $dbName.$oldTblName to $dbName.$newTblName", ex)
          }
        }
      }
    }

  override def addColumn(dbName: String, tblName: String, column: Column): Future[Boolean] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::addColumn") {
        try {
          val sql =
            s"""ALTER TABLE "$dbName"."$tblName"
             |ADD COLUMN ${VerticaUtils.toColumnDDL(column)}
             |""".stripMargin;
          client.executeUpdate(sql) >= 0
        } catch {
          case ex: Throwable => {
            throw InternalError(s"Error when add column ${column.name} to table $dbName.$tblName", ex)
          }
        }
      }
    }

  override def addColumns(dbName: String, tblName: String, columns: Seq[Column]): Future[Boolean] =
    Profiler(s"[DDLExecutor] ${clazz}::addColumns") {
      val results: Seq[Future[Boolean]] = columns.map(column => addColumn(dbName, tblName, column))
      Future.collect(results).map(_.forall(identity))
    }

  override def updateColumn(dbName: String, tblName: String, column: Column): Future[Boolean] =
    Profiler(s"[DDLExecutor] ${clazz}::updateColumn") {
      Future.exception(InternalError(s"Unsupported operation update column ${column.name}"))
    }

  override def dropColumn(dbName: String, tblName: String, columnName: String): Future[Boolean] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::dropColumn") {
        try {
          val sql =
            s"""ALTER TABLE "$dbName"."$tblName"
                 |DROP COLUMN "$columnName"""".stripMargin;
          client.executeUpdate(sql) >= 0
        } catch {
          case ex: Throwable => {
            throw InternalError(s"Error when drop column $columnName to table $dbName.$tblName", ex)
          }
        }
      }
    }

  override def detectColumns(query: String): Future[Seq[Column]] =
    Future {
      Profiler(s"[DDLExecutor] ${clazz}::detectColumns") {
        try {
          val finalQuery =
            s"""SELECT *
             |FROM (
             |  $query
             |) AS T
             |WHERE 1 = 0
             |""".stripMargin
          client.executeQuery(finalQuery)(rs => VerticaUtils.parseColumns(rs.getMetaData))
        } catch {
          case ex: Throwable => throw DbExecuteError(ex.getMessage, ex)
        }
      }
    }

  override def migrateDataWithEncryption(
      sourceTable: TableSchema,
      destTable: TableSchema,
      encryptedColumnNames: Seq[String],
      decryptedColumns: Seq[String]
  ): Future[Boolean] = ???
}
