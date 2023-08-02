package co.datainsider.jobworker.service.handler

import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
import co.datainsider.jobworker.domain.source.JdbcSource
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

class MySqlMetadataHandler(val jdbcSource: JdbcSource) extends JdbcSourceMetadataHandler {
  val client: JdbcClient = NativeJDbcClient(jdbcSource.jdbcUrl, jdbcSource.username, jdbcSource.password)

  override def testConnection(): Future[Boolean] =
    Future {
      try {
        client.executeQuery("select 1")(_.next())
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listDatabases(): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery("SHOW DATABASES")(toSeq)
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listTables(databaseName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(s"SHOW TABLES FROM $databaseName")(toSeq)
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(s"""
             |SELECT COLUMN_NAME
             |FROM INFORMATION_SCHEMA.COLUMNS
             |WHERE TABLE_SCHEMA = '$databaseName' AND TABLE_NAME = '$tableName';
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
