package datainsider.jobworker.service.handlers

import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.inject.app.TestInjector
import datainsider.client.exception.BadRequestError
import datainsider.client.module.MockSchemaClientModule
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.MetadataService
import org.scalatest.FunSuite

class GetTikTokTokenTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()

  val service: MetadataService = injector.instance[MetadataService]

  val authCode =
    "50467ac45b699eba5cdf07eb3add80b8e45de6bc"

  test("test get tiktok token") {
    val token = await(service.getTikTokToken(authCode))
    assert(token.accessToken.nonEmpty)
  }

  test("test exchange token with invalid access token") {
    val token = service.getTikTokToken("36b8801721e1c9d4222732042eb51c9540777f51")
    assertFailedFuture[BadRequestError](token)
  }

}
