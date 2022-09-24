package datainsider.user_caas.services

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.user_profile.TestServer
import datainsider.user_profile.module.MockSqlScriptModule

/**
  * @author tvc12 - Thien Vi
  * @created 01/25/2022 - 11:46 AM
  */
abstract class DataInsiderIntegrationTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(new TestServer().modules).create

  override def beforeAll(): Unit = {
    super.beforeAll()
    MockSqlScriptModule.singletonPostWarmupComplete(injector)
  }
}
