package datainsider.jobworker.service.handler

import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.jobworker.client.{JdbcClient, NativeJdbcClient}
import datainsider.jobworker.domain.JdbcSource
import datainsider.jobworker.util.ZConfig

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

class OracleMetadataHandler(val jdbcSource: JdbcSource) extends JdbcSourceMetadataHandler {
  System.setProperty("oracle.jdbc.timezoneAsRegion", "false")
  val client: JdbcClient = NativeJdbcClient(jdbcSource.jdbcUrl, jdbcSource.username, jdbcSource.password)

  override def testConnection(): Future[Boolean] =
    Future {
      try {
        client.executeQuery("select 1 from dual")(_.next())
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listDatabases(): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery("SELECT USERNAME FROM ALL_USERS")(toSeq)
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listTables(databaseName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(s"SELECT TABLE_NAME FROM all_tables WHERE OWNER = '$databaseName'")(toSeq)
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(s"""
             |SELECT column_name
             |FROM all_tab_cols
             |WHERE table_name = '$tableName'
             |""".stripMargin)(toSeq)
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }
  private def toSeq(rs: ResultSet): Seq[String] = {
    val rows = ArrayBuffer.empty[String]
    while (rs.next()) {
      rows += rs.getString(1)
    }
    rows
  }
}
