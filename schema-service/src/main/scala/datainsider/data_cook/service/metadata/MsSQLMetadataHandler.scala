package datainsider.data_cook.service.metadata

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.util.{JdbcClient, ZConfig}
import datainsider.data_cook.domain.response.{ThirdPartyDatabaseInfo, ThirdPartyTableInfo}
import datainsider.data_cook.pipeline.exception.{ListDatabaseException, ListTableException}
import datainsider.data_cook.pipeline.operator.persist.MsSQLPersistOperator
import datainsider.ingestion.domain.PageResult

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

class MsSQLMetadataHandler(
    client: JdbcClient,
    operator: MsSQLPersistOperator,
    timeoutInSecond: Int = ZConfig.getInt("data_cook.connection_timeout_in_second", 60)
) extends AbstractJdbcMetaDataHandler(client) with Logging {

  override def testConnection(): Future[Boolean] = {
    try {
      val isValid = client.getConnection().isValid(timeoutInSecond)
      Future.value(isValid)
    } catch {
      case ex: Throwable =>
        error(s"exception when connect to ${operator} failure, cause ${ex.getMessage}")
        Future.False
    }
  }

  @throws[ListDatabaseException]
  override def listDatabases(): Future[PageResult[ThirdPartyDatabaseInfo]] = {
    try {
      val databases: Seq[ThirdPartyDatabaseInfo] = client.executeQuery(
          """
            |SELECT SCHEMA_NAME
            |FROM INFORMATION_SCHEMA.SCHEMATA
            |WHERE
            | CATALOG_NAME = ?
            | AND
            | SCHEMA_OWNER = 'dbo'
            |""".stripMargin,
          operator.catalogName
        )(parseToSeq)
        .map(name => ThirdPartyDatabaseInfo(name))
      Future.value(PageResult(databases.size, databases))
    } catch {
      case ex: Throwable => Future.exception(ListDatabaseException(s"list database failure cause ${ex.getMessage}", ex))
    }
  }

  @throws[ListTableException]
  override def listTables(databaseName: String): Future[PageResult[ThirdPartyTableInfo]] = {
    try {
      // method will throw exception: Unknown database ${databaseName}
      val tables = client
          .executeQuery(
            """
              |SELECT TABLE_NAME
              |FROM INFORMATION_SCHEMA.TABLES
              |WHERE
              | TABLE_CATALOG = ?
              | AND
              | TABLE_SCHEMA = ?
              |""".stripMargin,
            operator.catalogName,
            databaseName
          )(parseToSeq)
          .map(name => ThirdPartyTableInfo(name))
      Future.value(PageResult(tables.size, tables))
    } catch {
      case ex: Throwable => Future.exception(ListTableException("list table failure cause ${ex.getMessage}", ex))
    }
  }

  private def parseToSeq(rs: ResultSet): Seq[String] = {
    val rows = ArrayBuffer.empty[String]
    while (rs.next()) {
      rows += rs.getString(1)
    }
    rows
  }
}
