package datainsider.jobscheduler.client

import datainsider.jobscheduler.client.JdbcClient.Record
import datainsider.jobscheduler.util.Using

import java.sql.{Connection, DriverManager, PreparedStatement, ResultSet, Statement}

object JdbcClient {
  type Record = Array[Any]
}

trait JdbcClient {
  def getConnection(): Connection

  def executeQuery[T](query: String, values: Any*)(implicit
      converter: ResultSet => T
  ): T

  def executeUpdate(query: String, values: Any*): Int

  def executeTransaction(
      queries: Array[String],
      valuesArr: Array[Array[Any]]
  ): Boolean

  def executeBatchUpdate(query: String, records: Array[Record]): Int

  def executeInsert(query: String, values: Any*): Long
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
  def executeQuery[T](query: String, values: Any*)(implicit
      converter: ResultSet => T
  ): T = {
    Using(getConnection()) { conn =>
      {
        Using(conn.prepareStatement(query)) { statement =>
          {
            Using(parameterizeStatement(statement, values).executeQuery())(rs => {
              converter(rs)
            })
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
  def executeTransaction(
      queries: Array[String],
      valuesArr: Array[Array[Any]]
  ): Boolean = {
    Using(getConnection()) { conn =>
      {
        conn.setAutoCommit(false)
        try {
          for ((query, values) <- queries zip valuesArr) yield {
            Using(conn.prepareStatement(query)) { statement =>
              {
                parameterizeStatement(statement, values).executeUpdate()
              }
            }
          }
          conn.commit()
          true
        } catch {
          case _: Exception =>
            conn.rollback()
            false
        } finally conn.setAutoCommit(true)
      }
    }
  }

  private def parameterizeStatement(
      statement: PreparedStatement,
      values: Seq[Any]
  ): PreparedStatement = {
    var paramIndex = 1
    for (value <- values) {
      value match {
        case v: Boolean              => statement.setBoolean(paramIndex, v)
        case v: java.math.BigDecimal => statement.setBigDecimal(paramIndex, v)
        case v: Byte                 => statement.setByte(paramIndex, v)
        case v: java.sql.Date        => statement.setDate(paramIndex, v)
        case v: java.sql.Time        => statement.setTime(paramIndex, v)
        case v: java.sql.Timestamp   => statement.setTimestamp(paramIndex, v)
        case v: Float                => statement.setFloat(paramIndex, v)
        case v: Double               => statement.setDouble(paramIndex, v)
        case v: Int                  => statement.setInt(paramIndex, v)
        case v: Long                 => statement.setLong(paramIndex, v)
        case v: String               => statement.setString(paramIndex, v)
        case v if v == null          => statement.setObject(paramIndex, v)
        case e: Any                  => throw new UnsupportedOperationException
      }
      paramIndex += 1
    }
    statement
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
}

case class NativeJdbcClient(jdbcUrl: String, username: String, password: String) extends AbstractJdbcClient {
  override def getConnection(): Connection =
    DriverManager.getConnection(jdbcUrl, username, password)
}

case class HikariClient(jdbcUrl: String, username: String, password: String) extends AbstractJdbcClient() {

  import com.zaxxer.hikari.HikariDataSource

  val ds = new HikariDataSource
  ds.setJdbcUrl(jdbcUrl)
  ds.setUsername(username)
  ds.setPassword(password)

  override def getConnection(): Connection = ds.getConnection
}
