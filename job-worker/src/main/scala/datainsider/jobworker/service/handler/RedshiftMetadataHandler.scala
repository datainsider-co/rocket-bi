package datainsider.jobworker.service.handler

import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.jobworker.client.{JdbcClient, NativeJdbcClient}
import datainsider.jobworker.domain.JdbcSource
import datainsider.jobworker.util.ZConfig

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

class RedshiftMetadataHandler(val jdbcSource: JdbcSource) extends JdbcSourceMetadataHandler {
  val client: JdbcClient = NativeJdbcClient(jdbcSource.jdbcUrl, jdbcSource.username, jdbcSource.password)

  override def testConnection(): Future[Boolean] =
    Future {
      try {
        client.executeQuery("select 1;")(_.next())
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listDatabases(): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery("""
            |select s.nspname as table_schema
            |from pg_catalog.pg_namespace s
            |join pg_catalog.pg_user u on u.usesysid = s.nspowner
            |order by table_schema;
            |""".stripMargin)(toSeq)
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listTables(databaseName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery("SELECT DISTINCT tablename FROM pg_table_def WHERE schemaname = 'public'")(toSeq)
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(s"""
            |SELECT column_name
            |FROM information_schema.columns
            |WHERE table_name = '$tableName' AND table_schema = '$databaseName'
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
