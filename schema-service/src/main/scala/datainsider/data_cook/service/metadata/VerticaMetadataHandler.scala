package datainsider.data_cook.service.metadata

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.util.{JdbcClient, ZConfig}
import datainsider.data_cook.domain.response.{ThirdPartyDatabaseInfo, ThirdPartyTableInfo}
import datainsider.data_cook.pipeline.exception.{ListDatabaseException, ListTableException}
import datainsider.data_cook.pipeline.operator.persist.VerticaPersistOperator
import datainsider.ingestion.domain.PageResult

class VerticaMetadataHandler(
    client: JdbcClient,
    operator: VerticaPersistOperator,
    timeoutInSecond: Int = ZConfig.getInt("data_cook.connection_timeout_in_second", 60)
) extends AbstractJdbcMetaDataHandler(client)
    with Logging {

  override def testConnection(): Future[Boolean] = {
    try {
      val isConnected = client.testConnection(timeoutInSecond)
      Future.value(isConnected)
    } catch {
      case ex: Throwable =>
        logger.error(s"exception when connect to ${operator} failure, cause ${ex.getMessage}")
        Future.False
    }
  }

  @throws[ListDatabaseException]
  override def listDatabases(): Future[PageResult[ThirdPartyDatabaseInfo]] = {
    try {
      val databases: Seq[ThirdPartyDatabaseInfo] = client.getDatabases().map(dbName => ThirdPartyDatabaseInfo(dbName))
      Future.value(PageResult(databases.size, databases))
    } catch {
      case ex: Throwable =>
        Future.exception(ListDatabaseException(s"list database failure cause ${ex.getMessage}", ex))
    }
  }

  @throws[ListTableException]
  override def listTables(databaseName: String): Future[PageResult[ThirdPartyTableInfo]] = {
    try {
      val tables: Seq[ThirdPartyTableInfo] = client.getTables(null, databaseName).map(tblName => ThirdPartyTableInfo(tblName))
      Future.value(PageResult(tables.size, tables))
    } catch {
      case ex: Throwable => Future.exception(ListTableException("list table failure cause ${ex.getMessage}", ex))
    }
  }
}
