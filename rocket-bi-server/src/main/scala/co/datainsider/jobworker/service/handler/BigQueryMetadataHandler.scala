package co.datainsider.jobworker.service.handler

import co.datainsider.jobworker.domain.source.JdbcSource
import co.datainsider.jobworker.repository.reader.BigQueryClient
import com.google.cloud.bigquery.FieldValueList
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError

import scala.collection.mutable.ArrayBuffer

class BigQueryMetadataHandler(val jdbcSource: JdbcSource) extends JdbcSourceMetadataHandler {
  val info: Array[String] = jdbcSource.password.split(",")(1).split(":")
  val projectId: String = info(1).replace('"', ' ')
  val client = new BigQueryClient(jdbcSource)

  override def testConnection(): Future[Boolean] =
    Future {
      try {
        client.executeQuery("select 1")(rows => {
          if (rows.nonEmpty) rows.head.get(0).getLongValue == 1
          else false
        })
      } catch {
        case e: Throwable =>
          throw BadRequestError(s"unable to connect to bigquery, please check database and table info")
      }
    }

  override def listDatabases(): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(s"SELECT schema_name FROM $projectId.INFORMATION_SCHEMA.SCHEMATA")(toSeq)
      } catch {
        case e: Throwable => Nil
      }
    }

  override def listTables(databaseName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(s"SELECT table_name FROM $databaseName.INFORMATION_SCHEMA.TABLES")(toSeq)
      } catch {
        case e: Throwable => Nil
      }
    }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] =
    Future {
      try {
        client.executeQuery(s"""
             |SELECT column_name
             |FROM $databaseName.INFORMATION_SCHEMA.COLUMNS
             |WHERE table_name='$tableName'
             |""".stripMargin)(toSeq)
      } catch {
        case e: Throwable => Nil
      }
    }

  private def toSeq(rows: Iterable[FieldValueList]): Seq[String] = {
    val result = ArrayBuffer.empty[String]
    rows.foreach(row => {
      row.forEach(data => {
        result += data.getStringValue
      })
    })
    result
  }

}
