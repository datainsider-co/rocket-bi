package co.datainsider.jobworker.service.handler

import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
import co.datainsider.jobworker.domain.source.JdbcSource
import co.datainsider.bi.util.Using
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

class GenericJdbcMetadataHandler(val jdbcSource: JdbcSource) extends JdbcSourceMetadataHandler {
  val client: JdbcClient = NativeJDbcClient(jdbcSource.jdbcUrl, jdbcSource.username, jdbcSource.password)

  override def testConnection(): Future[Boolean] =
    Future {
      try {
        Using(client.getConnection()) { conn =>
          conn.isValid(30000)
        }
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listDatabases(): Future[Seq[String]] =
    Future {
      try {
        Using(client.getConnection()) { conn =>
          val rs: ResultSet = conn.getMetaData.getSchemas()
          val dbNames = ArrayBuffer.empty[String]
          while (rs.next()) {
            val dbName: String = rs.getString("TABLE_SCHEM")
            dbNames += dbName
          }
          dbNames
        }
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listTables(databaseName: String): Future[Seq[String]] =
    Future {
      try {
        Using(client.getConnection()) { conn =>
          val rs: ResultSet = conn.getMetaData.getTables(null, databaseName, null, Array("TABLE"))
          val tableNames = ArrayBuffer.empty[String]
          while (rs.next()) {
            val tableName: String = rs.getString("TABLE_NAME")
            tableNames += tableName
          }
          tableNames
        }
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] =
    Future {
      try {
        Using(client.getConnection()) { conn =>
          val rs: ResultSet = conn.getMetaData.getColumns(null, databaseName, tableName, null)
          val columnNames = ArrayBuffer.empty[String]
          while (rs.next()) {
            val columnName: String = rs.getString("COLUMN_NAME")
            columnNames += columnName
          }
          columnNames
        }
      } catch {
        case e: Throwable => throw BadRequestError(s"unable to connect to data source: $e")
      }
    }
}
