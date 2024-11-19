package co.datainsider.bi.client

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.client.PreparedStatementUtils.parameterizeStatement
import co.datainsider.bi.engine.Client

import java.sql.{Connection, DriverManager, PreparedStatement, ResultSet, Statement, Timestamp}
import co.datainsider.bi.util.Using
import co.datainsider.common.client.exception.{DbExecuteError, InternalError, UnsupportedError}
import org.joda.time.{LocalDate, LocalDateTime}

import java.util.Properties
import scala.collection.mutable.ArrayBuffer

object JdbcClient {
  type Record = Array[Any]
}

trait JdbcClient extends Client {
  def getConnection(): Connection

  def executeQuery[T](query: String, values: Any*)(implicit converter: ResultSet => T): T

  def executeUpdate(query: String, values: Any*): Int

  def executeTransaction(queries: Array[String], valuesArr: Array[Array[Any]]): Boolean

  def useTransaction[T](fn: Connection => T): T

  def executeBatchUpdate(query: String, records: Array[Record]): Int

  def executeInsert(query: String, values: Any*): Long

  /**
    * @return incremental ids
    */
  def executeMultiInsert(query: String, values: Array[Array[Any]]): Seq[Long]

  @throws[DbExecuteError]("if test connection failure")
  def testConnection(timeoutMs: Int): Boolean

  /**
    * @param catalog table catalog (may be null)
    * @return
    */
  @throws[DbExecuteError]("if get databases failure")
  def getDatabases(catalog: String = null): Seq[String]

  /**
    * @param catalog table catalog (may be null)
    * @param dbName table schema (may be null)
    * @param tblType table type. Typical types are "TABLE", "VIEW", "SYSTEM TABLE", "GLOBAL TEMPORARY", "LOCAL TEMPORARY", "ALIAS", "SYNONYM". Default ["Table"]
    */
  @throws[DbExecuteError]("if get tables failure")
  def getTables(catalog: String, dbName: String, tblType: Seq[String] = Seq("TABLE")): Seq[String]

  /**
    * @param catalog table catalog (may be null)
    * @param dbName table schema (may be null)
    * @param tblName table name
    * @return
    */
  @throws[DbExecuteError]("if get columns failure")
  def getColumns(catalog: String, dbName: String, tblName: String): Seq[String]

}

abstract class AbstractJdbcClient extends JdbcClient {

  def getConnection(): Connection

  /** *
    *
    * Ex: executeQuery( "Select from Users where id = ?;", 1)
    * Supported Type: Boolean, BigDecimal, Byte, Date, Float, Double, Int, Long, String, Time, Timestamp
    *
    * @param query  Parameterized Query
    * @param values Value to put to parameterized query
    * @return
    */
  def executeQuery[T](query: String, values: Any*)(implicit converter: ResultSet => T): T = {
    Using(getConnection()) { conn =>
      {
        Using(conn.prepareStatement(query)) { statement =>
          {
            converter(parameterizeStatement(statement, values).executeQuery())
          }
        }
      }
    }
  }

  /** *
    *
    * Ex: executeUpdate( "Insert INTO Users(?,?)", 1L, "User A")
    * Supported Type: Boolean, BigDecimal, Byte, Date, Float, Double, Int, Long, String, Time, Timestamp
    *
    * @param query  Parameterized Query
    * @param values Value to put to parameterized query
    * @return
    */
  def executeUpdate(query: String, values: Any*): Int = {
    Using(getConnection()) { conn =>
      {
        Using(conn.prepareStatement(query)) { statement =>
          {
            parameterizeStatement(statement, values).executeUpdate()
          }
        }
      }
    }
  }

  /** *
    *
    * Execute list of queries in transaction manner, values of each queries is parameterized
    * Make sure to provide queries and corresponding values in order
    *
    * @param queries
    * @param valuesArr
    * @return
    */
  def executeTransaction(queries: Array[String], valuesArr: Array[Array[Any]]): Boolean = {
    useTransaction(conn => {
      for ((query, values) <- queries zip valuesArr) yield {
        Using(conn.prepareStatement(query)) { statement =>
          {
            parameterizeStatement(statement, values).executeUpdate()
          }
        }
      }
      true
    })
  }

  def useTransaction[T](fn: Connection => T): T = {
    Using(getConnection()) { conn =>
      {
        conn.setAutoCommit(false)
        try {
          val result = fn(conn)
          conn.commit()
          result
        } catch {
          case ex: Exception =>
            conn.rollback()
            throw InternalError(s"Transaction failed cause ${ex.getMessage}", ex)
        } finally {
          conn.setAutoCommit(true)
        }
      }
    }
  }

  def executeBatchUpdate(query: String, records: Array[Record]): Int = {
    Using(getConnection()) { conn =>
      {
        Using(conn.prepareStatement(query)) { statement =>
          {
            records.foreach(record => {
              parameterizeStatement(statement, record)
              statement.addBatch()
            })
            statement.executeBatch()
            records.length
          }
        }
      }
    }
  }

  def executeInsert(query: String, values: Any*): Long = {
    Using(getConnection()) { conn =>
      {
        Using(conn.prepareStatement(query, Statement.RETURN_GENERATED_KEYS)) { statement =>
          {
            parameterizeStatement(statement, values).executeUpdate()
            val rsKeys = statement.getGeneratedKeys
            if (rsKeys.next())
              rsKeys.getLong(1)
            else -1
          }
        }
      }
    }
  }

  def executeMultiInsert(query: String, values: Array[Array[Any]]): Seq[Long] = {
    Using(getConnection()) { conn => {
        Using(conn.prepareStatement(query, Statement.RETURN_GENERATED_KEYS)) { statement => {
            values.foreach(record => {
              parameterizeStatement(statement, record)
              statement.addBatch()
            })
            statement.executeBatch()
            val rs: ResultSet = statement.getGeneratedKeys
            val keys = ArrayBuffer.empty[Long]
            while (rs.next()) {
              keys += rs.getLong(1)
            }
            keys
          }
        }
      }
    }
  }

  override def testConnection(timeoutMs: Int): Boolean = {
    try {
      Using(getConnection()) { conn =>
        conn.isValid(timeoutMs)
      }
    } catch {
      case ex: Throwable => {
        throw DbExecuteError(s"Error while testing connection, cause: ${ex.getMessage}", ex)
      }
    }
  }

  override def getDatabases(catalog: String): Seq[String] = {
    try {
      Using(getConnection()) { conn =>
        val rs: ResultSet = conn.getMetaData.getSchemas(catalog, null)
        val dbNames = ArrayBuffer.empty[String]
        while (rs.next()) {
          val dbName: String = rs.getString("TABLE_SCHEM")
          dbNames += dbName
        }
        dbNames
      }
    } catch {
      case ex: Throwable => throw DbExecuteError(ex.getMessage, ex)
    }
  }

  override def getTables(catalog: String, dbName: String, tblType: Seq[String]): Seq[String] = {
    try {
      Using(getConnection()) { conn =>
        val rs: ResultSet = conn.getMetaData.getTables(catalog, dbName, null, tblType.toArray)
        val tableNames = ArrayBuffer.empty[String]
        while (rs.next()) {
          val tableName: String = rs.getString("TABLE_NAME")
          tableNames += tableName
        }
        tableNames
      }
    } catch {
      case ex: Throwable => throw DbExecuteError(ex.getMessage, ex)
    }
  }

  override def getColumns(catalog: String, dbName: String, tblName: String): Seq[String] = {
    try {
      Using(getConnection()) { conn =>
        val rs: ResultSet = conn.getMetaData.getColumns(catalog, dbName, tblName, null)
        val columnNames = ArrayBuffer.empty[String]
        while (rs.next()) {
          val columnName: String = rs.getString("COLUMN_NAME")
          columnNames += columnName
        }
        columnNames
      }
    } catch {
      case ex: Throwable => throw DbExecuteError(ex.getMessage, ex)
    }
  }

}

case class NativeJDbcClient(jdbcUrl: String, username: String, password: String) extends AbstractJdbcClient {
  override def getConnection(): Connection = DriverManager.getConnection(jdbcUrl, username, password)

  override def close(): Unit = {}
}

case class HikariClient(
    jdbcUrl: String,
    username: String,
    password: String,
    maxPoolSize: Option[Int] = None,
    properties: Option[Properties] = None,
    driverClassName: Option[String] = None
) extends AbstractJdbcClient() {

  import com.zaxxer.hikari.HikariDataSource

  val ds = new HikariDataSource
  ds.setJdbcUrl(jdbcUrl)
  ds.setUsername(username)
  ds.setPassword(password)
  if (maxPoolSize.isDefined && maxPoolSize.get > 0) {
    ds.setMaximumPoolSize(maxPoolSize.get)
  }
  if (driverClassName.isDefined) {
    ds.setDriverClassName(driverClassName.get)
  }
  //specific performance tune for mysql
  ds.addDataSourceProperty("cachePrepStmts", true)
  ds.addDataSourceProperty("prepStmtCacheSize", 250)
  ds.addDataSourceProperty("prepStmtCacheSqlLimit", 2048)
  ds.addDataSourceProperty("useServerPrepStmts", true)
  ds.addDataSourceProperty("useLocalSessionState", true)
  ds.addDataSourceProperty("rewriteBatchedStatements", false) // true value causes executeBatchUpdate bug
  ds.addDataSourceProperty("cacheResultSetMetadata", true)
  ds.addDataSourceProperty("cacheServerConfiguration", true)
  ds.addDataSourceProperty("elideSetAutoCommits", true)
  ds.addDataSourceProperty("maintainTimeStats", false)
  if (properties.nonEmpty) {
    ds.setDataSourceProperties(properties.get)
  }

  override def getConnection(): Connection = ds.getConnection

  def close(): Unit = {
    ds.close()
  }

}

case class NativeJdbcClientWithProperties(jdbcUrl: String, properties: Properties) extends AbstractJdbcClient {
  override def getConnection(): Connection = {
    DriverManager.getConnection(jdbcUrl, properties)
  }

  override def close(): Unit = {}
}

object PreparedStatementUtils {
  def parameterizeStatement(statement: PreparedStatement, values: Seq[Any]): PreparedStatement = {
    var paramIndex = 1
    for (value <- values) {
      value match {
        case value: Boolean               => statement.setBoolean(paramIndex, value)
        case value: java.math.BigDecimal  => statement.setBigDecimal(paramIndex, value)
        case value: java.math.BigInteger  => statement.setLong(paramIndex, value.longValue())
        case value: scala.math.BigDecimal => statement.setBigDecimal(paramIndex, value.bigDecimal)
        case value: scala.math.BigInt     => statement.setLong(paramIndex, value.longValue())
        case value: Byte                  => statement.setByte(paramIndex, value)
        case value: java.sql.Date         => statement.setDate(paramIndex, value)
        case value: java.sql.Time         => statement.setTime(paramIndex, value)
        case value: java.sql.Timestamp    => statement.setTimestamp(paramIndex, value)
        case value: LocalDateTime         => statement.setTimestamp(paramIndex, new Timestamp(value.toDateTime().getMillis))
        case value: LocalDate =>
          statement.setTimestamp(paramIndex, new Timestamp(value.toDateTimeAtStartOfDay().getMillis))
        case value: java.time.LocalDateTime => statement.setTimestamp(paramIndex, Timestamp.valueOf(value))
        case value: java.time.LocalDate     => statement.setTimestamp(paramIndex, Timestamp.valueOf(value.atStartOfDay()))
        case value: Float                   => statement.setFloat(paramIndex, value)
        case value: Double                  => statement.setDouble(paramIndex, value)
        case value: Short                   => statement.setShort(paramIndex, value)
        case value: Int                     => statement.setInt(paramIndex, value)
        case value: Long                    => statement.setLong(paramIndex, value)
        case value: String                  => statement.setString(paramIndex, value)
        case value: java.sql.Array          => statement.setArray(paramIndex, value)
        case v if v == null                 => statement.setObject(paramIndex, value)
        case value: Any                     => throw new UnsupportedOperationException(s"can not parameterize value: $value ")
      }
      paramIndex += 1
    }
    statement
  }
}
