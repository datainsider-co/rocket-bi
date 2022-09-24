
package co.datainsider.share.service

import co.datainsider.bi.TestServer
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

/**
  * @author tvc12 - Thien Vi
  * @created 03/11/2021 - 10:59 AM
  */

object TestApp extends TestServer

trait BaseServiceTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestApp.modules).newInstance()
}

