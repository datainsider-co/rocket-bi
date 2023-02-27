package datainsider.jobworker.service.handlers

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.exception.BadRequestError
import datainsider.client.module.MockSchemaClientModule
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.MetadataService

class ExchangeFacebookTokenTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()

  val service: MetadataService = injector.instance[MetadataService]

  val accessToken =
    "EAAL6rO2TSzsBANQptrTaNglaFWUdwgsAsL7FPtVKP6CTvYZCubOwCc2h15TIlJ1X69MuZCbZCttpkSYvZBZC2iApRN71qQcrpXiAR6pnDwt1GqjavRYIj8yZB4MZBdZBvtZBiPKsazqoRDgu8f9cDBpY7ZA0D6SLw4oguYLfvJ0CqjisZATT7J96adRTPwPZC6txH2t3E1umIkahQ7LOUWvciA3xF7X7EW3qcuCoXrJN8Bccd7ET2GYzyvZBoZCKJruRxA67cZD"

  test("test exchange token") {
    val token = await(service.exchangeFacebookToken(accessToken))
    assert(token.tokenType.equals("bearer"))
    assert(token.expiresIn.toLong > 0)
    assert(!token.accessToken.equals(""))
  }
  test("test exchange token with wrong access token") {
    val token = service.exchangeFacebookToken("fake_token")
    assertFailedFuture[BadRequestError](token)
  }

}
