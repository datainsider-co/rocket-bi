package datainsider.data_cook.service.metadata

import com.twitter.inject.Test
import datainsider.client.util.ZConfig
import datainsider.data_cook.domain.EtlJob.ActionConfiguration2Operator
import datainsider.data_cook.domain.persist.{OracleJdbcPersistConfiguration, PersistentType}
import datainsider.data_cook.domain.request.EtlRequest.ListThirdPartyDatabaseRequest
import datainsider.data_cook.domain.response.{ThirdPartyDatabaseInfo, ThirdPartyTableInfo}
import datainsider.ingestion.domain.PageResult

/**
  * @author tvc12 - Thien Vi
  * @created 03/03/2022 - 11:33 PM
  */
class OracleMetaDataHandlerTest extends Test {
  val host: String = ZConfig.getString("data_cook.jdbc_test.oracle.host")
  val port: Int = ZConfig.getInt("data_cook.jdbc_test.oracle.port")
  val serviceName: String = ZConfig.getString("data_cook.jdbc_test.oracle.service_name")
  val username: String = ZConfig.getString("data_cook.jdbc_test.oracle.username")
  val password: String = ZConfig.getString("data_cook.jdbc_test.oracle.password")
  val dbname: String = ZConfig.getString("data_cook.jdbc_test.oracle.dbname")
  val config = OracleJdbcPersistConfiguration(host, port, serviceName, username, password, databaseName = dbname, tableName = "", persistType = PersistentType.Append)
  val handler = ThirdPartyMetaDataHandler(config.toOperator(0))


  test("List Database") {
    val result: PageResult[ThirdPartyDatabaseInfo] = await(handler.listDatabases())
    assertResult(result != null)(true)
    assertResult(result.total > 0)(true)
  }
  test("List Table") {
    val result: PageResult[ThirdPartyTableInfo] = await(handler.listTables(dbname))
    assertResult(result != null)(true)
  }
}
