package datainsider.data_cook.service.metadata

import com.twitter.inject.Test
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.util.ZConfig
import datainsider.data_cook.domain.EtlJob.ActionConfiguration2Operator
import datainsider.data_cook.domain.persist.{PersistentType, VerticaPersistConfiguration}
import datainsider.data_cook.domain.response.{ThirdPartyDatabaseInfo, ThirdPartyTableInfo}
import datainsider.data_cook.pipeline.exception.ListDatabaseException
import datainsider.ingestion.domain.PageResult

/**
  * @author tvc12 - Thien Vi
  * @created 03/03/2022 - 11:33 PM
  */
class VerticaMetaDataHandlerTest extends Test with Logging {
  val host: String = ZConfig.getString("data_cook.jdbc_test.vertica.host")
  val port: Int = ZConfig.getInt("data_cook.jdbc_test.vertica.port")
  val username: String = ZConfig.getString("data_cook.jdbc_test.vertica.username")
  val password: String = ZConfig.getString("data_cook.jdbc_test.vertica.password")
  val dbName = "public"
  val config = VerticaPersistConfiguration(host, port, username, password, catalog = "", databaseName ="", tableName = "", persistType = PersistentType.Append)
  val handler = ThirdPartyMetaDataHandler(config.toOperator(0))

  test("List database with unknown host") {
    val handler = ThirdPartyMetaDataHandler(config.copy(host = "demo.datainsider.co").toOperator(0))
    val result: Future[PageResult[ThirdPartyDatabaseInfo]] = handler.listDatabases()
    assertFailedFuture[ListDatabaseException](result)
  }

  test("List Database") {
    val pageResults: PageResult[ThirdPartyDatabaseInfo] = await(handler.listDatabases())
    println(s"database:: ${pageResults}")
    assertResult(pageResults != null)(true)
    assertResult(pageResults.data.nonEmpty)(true)
    assertResult(pageResults.total > 0)(true)
  }
  test("List Table") {
    val pageResult: PageResult[ThirdPartyTableInfo] = await(handler.listTables(dbName))
    println(s"table:: ${pageResult}")
    assertResult(pageResult != null)(true)
    assertResult(pageResult.total > 0)(true)
    assertResult(pageResult.data.nonEmpty)(true)
  }
}
