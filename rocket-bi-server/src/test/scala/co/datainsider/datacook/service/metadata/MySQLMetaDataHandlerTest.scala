package co.datainsider.datacook.service.metadata

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.datacook.domain.persist.{MySQLJdbcPersistConfiguration, PersistentType}
import co.datainsider.datacook.domain.response.ThirdPartyDatabaseInfo
import co.datainsider.schema.domain.PageResult
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.logging.Logging
import datainsider.client.util.ZConfig

import java.net.URI

/**
  * @author tvc12 - Thien Vi
  * @created 03/03/2022 - 11:33 PM
  */
class MySQLMetaDataHandlerTest extends IntegrationTest with Logging {
  override protected def injector: Injector = TestInjector(TestContainerModule).newInstance()

  val jdbcUrl = injector.instance[String](Names.named("mysql_jdbc_url"))
  val clientURI = jdbcUrl.substring(5)
  val uri = URI.create(clientURI)
  val host = uri.getHost
  val port = uri.getPort
  val username: String = ZConfig.getString("data_cook.jdbc_test.mysql.username")
  val password: String = ZConfig.getString("data_cook.jdbc_test.mysql.password")
  val dbname: String = ZConfig.getString("data_cook.jdbc_test.mysql.dbname")
  val config = MySQLJdbcPersistConfiguration(
    host,
    port,
    username,
    password,
    databaseName = dbname,
    tableName = "",
    persistType = PersistentType.Append
  )
  val handler = ThirdPartyMetaDataHandler(config.toOperator(0))

  test("List Database") {
    val result: PageResult[ThirdPartyDatabaseInfo] = await(handler.listDatabases())
    info(s"database:: ${result}")
    assertResult(result != null)(true)
    assertResult(result.total > 0)(true)
  }
  test("List Table") {
    assertFailedFuture[Throwable](handler.listTables("not_exist_db"))
  }

}
