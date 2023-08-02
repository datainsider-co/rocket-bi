package co.datainsider.datacook.service.metadata

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import co.datainsider.datacook.domain.response.{ThirdPartyDatabaseInfo, ThirdPartyTableInfo}
import co.datainsider.datacook.pipeline.exception.{ListDatabaseException, ListTableException}
import co.datainsider.datacook.pipeline.operator.persist.VerticaPersistOperator
import co.datainsider.schema.domain.PageResult
import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.ZConfig

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
      val tables: Seq[ThirdPartyTableInfo] =
        client.getTables(null, databaseName).map(tblName => ThirdPartyTableInfo(tblName))
      Future.value(PageResult(tables.size, tables))
    } catch {
      case ex: Throwable => Future.exception(ListTableException("list table failure cause ${ex.getMessage}", ex))
    }
  }
}
