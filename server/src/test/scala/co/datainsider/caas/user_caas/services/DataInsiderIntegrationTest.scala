package co.datainsider.caas.user_caas.services

import co.datainsider.bi.TestServer
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import co.datainsider.caas.user_profile.module.SqlScriptModule

/**
  * @author tvc12 - Thien Vi
  * @created 01/25/2022 - 11:46 AM
  */
abstract class DataInsiderIntegrationTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(new TestServer().modules).create

  override def beforeAll(): Unit = {
    super.beforeAll()
    SqlScriptModule.singletonPostWarmupComplete(injector)
  }
}
