package co.datainsider.jobworker.service.handler

import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
import co.datainsider.jobworker.domain.source.JdbcSource
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

class PostgresMetadataHandler(val jdbcSource: JdbcSource) extends JdbcSourceMetadataHandler {
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
        client.executeQuery("SELECT schema_name FROM information_schema.schemata;")(toSeq)
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listTables(databaseName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(
          s"SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname = '$databaseName'"
        )(toSeq)
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(
          s"""
             |SELECT column_name
             |FROM INFORMATION_SCHEMA.COLUMNS
             |WHERE TABLE_NAME='$tableName' and table_schema='$databaseName'
             |""".stripMargin
        )(toSeq)
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
