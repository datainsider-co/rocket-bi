package datainsider.data_cook.service.metadata

import com.twitter.util.Future
import datainsider.client.exception.UnsupportedError
import datainsider.client.util.{JdbcClient, NativeJdbcClientWithProperties}
import datainsider.data_cook.domain.response.{ThirdPartyDatabaseInfo, ThirdPartyTableInfo}
import datainsider.data_cook.pipeline.exception.{ListDatabaseException, ListTableException}
import datainsider.data_cook.pipeline.operator.Operator
import datainsider.data_cook.pipeline.operator.persist._
import datainsider.ingestion.domain.PageResult
import datainsider.ingestion.domain.Types.DBName


/**
  * @author tvc12 - Thien Vi
  * @created 02/25/2022 - 10:43 AM
  */
trait ThirdPartyMetaDataHandler {
  def testConnection(): Future[Boolean]

  @throws[ListDatabaseException]
  def listDatabases(): Future[PageResult[ThirdPartyDatabaseInfo]]

  @throws[ListTableException]
  def listTables(dbName: DBName): Future[PageResult[ThirdPartyTableInfo]]
}

abstract class AbstractJdbcMetaDataHandler(client: JdbcClient) extends ThirdPartyMetaDataHandler

object ThirdPartyMetaDataHandler {

  @throws[UnsupportedError]
  def apply(operator: Operator): ThirdPartyMetaDataHandler = {
    operator match {
      case operator: JDBCPersistOperator => {
        val client = NativeJdbcClientWithProperties(operator.jdbcUrl, operator.properties)
        operator match {
          case operator: OraclePersistOperator => new OracleMetadataHandler(client, operator)
          case operator: PostgresPersistOperator => new PostgresMetadataHandler(client, operator)
          case operator: MySQLPersistOperator => new MySqlMetadataHandler(client, operator)
          case operator: MsSQLPersistOperator => new MsSQLMetadataHandler(client, operator)
          case operator: VerticaPersistOperator => new VerticaMetadataHandler(client, operator)
          case _ => throw UnsupportedError(s"unsupported handler for ${operator.getClass}")
        }
      }
      case _ => throw UnsupportedError(s"Unsupported handler for ${operator.getClass}")
    }
  }
}
