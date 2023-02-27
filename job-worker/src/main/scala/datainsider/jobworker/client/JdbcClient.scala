package datainsider.jobworker.client

import com.twitter.inject.Logging
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.util.Using

import java.sql.{Connection, DriverManager, PreparedStatement, ResultSet}

object JdbcClient {
  type Record = Seq[Any]
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

  def executeBatchUpdate(query: String, records: Seq[Record]): Int
}

abstract class AbstractJdbcClient extends JdbcClient with Logging {

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
    * @param queries list of query to be executed in order
    * @param valuesArr values of each queries also in order
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
        case e: Any                  => throw new UnsupportedOperationException(s"can not parameterize value of type: $e ")
      }
      paramIndex += 1
    }
    statement
  }

  def executeBatchUpdate(query: String, records: Seq[Record]): Int = {
    Using(getConnection()) { conn =>
      {
        Using(conn.prepareStatement(query)) { statement =>
          {
            records.foreach(record => {
              try {
                parameterizeStatement(statement, record)
                statement.addBatch()
              } catch {
                case e: Throwable =>
                  logger.error(s"error when parameterize value for query: $e")
              }
            })
            statement.executeBatch()
            records.length
          }
        }
      }
    }
  }

}

case class NativeJdbcClient(jdbcUrl: String, username: String, password: String) extends AbstractJdbcClient {
  override def getConnection(): Connection = {
    DriverManager.setLoginTimeout(30)
    DriverManager.getConnection(jdbcUrl, username, password)
  }
}

case class HikariClient(jdbcUrl: String, username: String, password: String) extends AbstractJdbcClient() {

  import com.zaxxer.hikari.HikariDataSource

  val ds = new HikariDataSource
  ds.setJdbcUrl(jdbcUrl)
  ds.setUsername(username)
  ds.setPassword(password)
  ds.setConnectionTimeout(30000)

  override def getConnection(): Connection = ds.getConnection

}
