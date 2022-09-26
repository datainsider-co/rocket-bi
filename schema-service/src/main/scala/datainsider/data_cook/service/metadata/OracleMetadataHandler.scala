package datainsider.data_cook.service.metadata

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.util.{JdbcClient, ZConfig}
import datainsider.data_cook.domain.response.{ThirdPartyDatabaseInfo, ThirdPartyTableInfo}
import datainsider.data_cook.pipeline.exception.{ListDatabaseException, ListTableException}
import datainsider.data_cook.pipeline.operator.persist.OraclePersistOperator
import datainsider.ingestion.domain.PageResult

import java.sql.ResultSet
import scala.collection.mutable.ArrayBuffer

class OracleMetadataHandler(
    client: JdbcClient,
    operator: OraclePersistOperator,
    timeoutInSecond: Int = ZConfig.getInt("data_cook.connection_timeout_in_second", 300000)
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
      val databases = client
        .executeQuery("SELECT USERNAME FROM ALL_USERS ORDER BY USERNAME")(parseToSeq)
        .map(name => ThirdPartyDatabaseInfo(name))
      Future.value(PageResult(databases.size, databases))
    } catch {
      case ex: Throwable => Future.exception(ListDatabaseException(s"list database failure cause ${ex.getMessage}", ex))
    }
  }

  @throws[ListTableException]
  override def listTables(databaseName: String): Future[PageResult[ThirdPartyTableInfo]] = {
    try {
      val tables = client
        .executeQuery(s"SELECT TABLE_NAME FROM all_tables WHERE OWNER = ?", databaseName)(parseToSeq)
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
