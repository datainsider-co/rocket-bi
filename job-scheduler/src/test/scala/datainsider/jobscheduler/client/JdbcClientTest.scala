package datainsider.jobscheduler.client

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.jobscheduler.module.TestModule
import datainsider.lakescheduler.module.LakeTestModule

class JdbcClientTest extends IntegrationTest {

  override protected val injector: Injector =
    TestInjector(TestModule, LakeTestModule, MockSchemaClientModule, MockCaasClientModule).newInstance()

  val client: JdbcClient = injector.instance[JdbcClient]("mysql")

  test("jdbc client test") {
    val query = "show databases;"
    client.executeQuery(query)(rs => {
      while (rs.next()) {
        val dbName = rs.getString(1)
        assert(dbName != null)
      }
    })
  }
}
