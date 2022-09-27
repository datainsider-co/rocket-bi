package datainsider.schema.repository

import com.twitter.util.logging.Logging
import datainsider.client.exception.DbExecuteError
import datainsider.client.util.JdbcClient
import datainsider.profiler.Profiler
import datainsider.schema.domain.TableType.TableType
import datainsider.schema.domain._
import datainsider.schema.domain.column._
import datainsider.schema.util.Using

import java.sql.{DatabaseMetaData, ResultSet}
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.matching.Regex

trait ClickhouseMetaDataHandler {

  /**
    * Get all database of the clickhouse server
    */
  @throws[DbExecuteError]("Failed to get all databases")
  def getDatabaseNames(): Seq[String]

  /**
    * Get all tables of the clickhouse server by db name
    */
  @throws[DbExecuteError]("Failed to get all tables of tables")
  def getTables(organizationId: Long, dbName: String, ignoredEngines: Seq[String]): Seq[TableSchema]

  /**
    * Get all columns of the clickhouse server by db name and table name
    */
  @throws[DbExecuteError]("Failed to get all columns of table")
  def getColumns(dbName: String, tableName: String): Seq[Column]
}

class ClickhouseMetaDataHandlerImpl(client: JdbcClient) extends ClickhouseMetaDataHandler with Logging {
  private val AS_SELECT_REGEX: Regex = "(?i)\\s+as\\s+(select.*)".r

  override def getDatabaseNames(): Seq[String] =
    Profiler("[ClickhouseMetaDataHandlerImpl].getDatabaseNames") {
      try {
        Using(client.getConnection()) { conn =>
          {
            val metaData: DatabaseMetaData = conn.getMetaData
            val schemaRs: ResultSet = metaData.getSchemas
            val databases = ArrayBuffer.empty[String]
            while (schemaRs.next()) {
              databases += schemaRs.getString("TABLE_SCHEM")
            }
            databases
          }
        }
      } catch {
        case ex: Throwable =>
          logger.error("Failed to get all databases", ex)
          throw DbExecuteError(ex.getMessage)
      }
    }

  override def getTables(organizationId: Long, dbName: String, ignoredEngines: Seq[String]): Seq[TableSchema] =
    Profiler("[ClickhouseMetaDataHandlerImpl].getTables") {
      try {
        val tableSchemaQuery =
          s"""
           |SELECT *
           |FROM system.tables
           |WHERE database = ? ${ignoredEngines.map(engine => s"AND engine != '${engine}'").mkString(" ")}
           |""".stripMargin
        logger.debug("Executing query get table schema: " + tableSchemaQuery)
        client.executeQuery(tableSchemaQuery, dbName)(rs => toTableSchemas(organizationId, dbName, rs))
      } catch {
        case ex: Throwable =>
          logger.error("Failed to get all tables of tables", ex)
          throw DbExecuteError(ex.getMessage)
      }
    }

  private def toTableSchemas(organizationId: Long, dbName: String, rs: ResultSet): Seq[TableSchema] = {
    val tables = ArrayBuffer.empty[TableSchema]
    while (rs.next()) {
      val tableName = rs.getString("name")
      tables += TableSchema(
        name = rs.getString("name"),
        dbName = dbName,
        organizationId = organizationId,
        displayName = rs.getString("name"),
        columns = getColumns(dbName, tableName),
        engine = None,
        primaryKeys = getPrimaryKeys(rs.getString("primary_key")),
        partitionBy = getPartitionBy(rs.getString("partition_key")),
        orderBys = getOrderBy(rs.getString("sorting_key")),
        query = getQuery(rs.getString("create_table_query")),
        tableType = getTableType(rs.getString("engine")),
        tableStatus = None,
        ttl = None,
        expressionColumns = Seq.empty
      )
    }
    tables
  }

  private def getPartitionBy(partition: String): Seq[String] = {
    if (partition != null) {
      partition.split(",").map(_.trim)
    } else {
      Seq.empty
    }
  }

  private def getPrimaryKeys(primaryKeys: String): Seq[String] = {
    if (primaryKeys != null) {
      primaryKeys.split(",").map(_.trim)
    } else {
      Seq.empty
    }
  }

  private def getOrderBy(primaryKeys: String): Seq[String] = {
    if (primaryKeys != null) {
      primaryKeys.split(",").map(_.trim)
    } else {
      Seq.empty
    }
  }

  private def getTableType(engine: String): Option[TableType] = {
    if (engine != null) {
      if (engine.toLowerCase.contains("mergetree")) {
        Some(TableType.Default)
      } else {
        engine match {
          case "View"        => Some(TableType.View)
          case "Memory"      => Some(TableType.InMemory)
          case "Distributed" => Some(TableType.Default)
          case _ =>
            logger.warn(s"cannot detect table type of ${engine}, use table type default")
            None
        }
      }
    } else {
      None
    }
  }

  override def getColumns(dbName: String, tblName: String): Seq[Column] =
    Profiler("[ClickhouseMetaDataHandlerImpl].getColumns") {
      try {
        val columnsQuery = """
                           |SELECT *
                           |FROM system.columns
                           |WHERE database = ? AND table = ?
                           |""".stripMargin
        logger.debug("Executing query get table columns: " + columnsQuery)
        client.executeQuery(columnsQuery, dbName, tblName)(rs => toColumns(rs))
      } catch {
        case ex: Throwable =>
          logger.error("Failed to get all columns of table", ex)
          throw DbExecuteError(ex.getMessage)
      }
    }

  private def toColumns(rs: ResultSet): Seq[Column] = {
    val columns = ArrayBuffer.empty[Column]
    while (rs.next()) {
      val name: String = rs.getString("name")
      val `type`: String = rs.getString("type")
      val isNullable: Boolean = `type`.startsWith("Nullable")
      val defaultExpr = Option(rs.getString("default_expression"))
      val defaultExpression: Option[DefaultExpression] =
        getDefaultExpression(rs.getString("default_kind"), defaultExpr.orNull)
      val column: Column = `type` match {
        case _ if (`type`.contains("UInt8")) =>
          UInt8Column(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        case _ if (`type`.contains("UInt16")) =>
          UInt16Column(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        case _ if (`type`.contains("UInt32")) =>
          UInt32Column(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        case _ if (`type`.contains("UInt64")) =>
          UInt64Column(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        // do not move Int to up because it will be matched with UInt8, UInt16, UInt32, UInt64
        case _ if (`type`.contains("Int8")) =>
          Int8Column(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        case _ if (`type`.contains("Int16")) =>
          Int16Column(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        case _ if (`type`.contains("Int32")) =>
          Int32Column(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        case _ if (`type`.contains("Int64")) =>
          Int64Column(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        case _ if (`type`.contains("Float")) =>
          FloatColumn(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        case _ if (`type`.contains("Float64")) =>
          DoubleColumn(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        case _ if (`type`.contains("DateTime")) =>
          DateTimeColumn(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        // force datetime64 to date time column, cause system work as well
        case _ if (`type`.contains("DateTime64")) =>
          DateTimeColumn(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        // do not move up or down this case, because it is a special case
        case _ if (`type`.contains("Date")) =>
          DateColumn(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
        // force to string column
        case _ => StringColumn(name, displayName = name, isNullable = isNullable, defaultExpression = defaultExpression)
      }
      columns += column
    }
    columns
  }

  private def getDefaultExpression(defaultKind: String, expression: String): Option[DefaultExpression] = {
    if ("MATERIALIZED" == defaultKind) {
      Some(DefaultExpression("MATERIALIZED", expression))
    } else {
      None
    }
  }

  private def getQuery(query: String): Option[String] = {
    if (query != null) {
      AS_SELECT_REGEX.findFirstMatchIn(query) match {
        case Some(asSelect) => Some(asSelect.group(1))
        case None           => None
      }
    } else {
      None
    }
  }
}
