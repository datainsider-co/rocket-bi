//fixme: this test is not working
//package co.datainsider.jobworker.service.handlers
//
//import co.datainsider.jobworker.module.JobWorkerTestModule
//import co.datainsider.jobworker.service.MetadataService
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import datainsider.client.exception.BadRequestError
//import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule, MockSchemaClientModule}
//
//class GetTikTokTokenTest extends IntegrationTest {
//  override protected def injector: Injector =
//    TestInjector(JobWorkerTestModule, MockHadoopFileClientModule, MockLakeClientModule, MockSchemaClientModule)
//      .newInstance()
//
//  val service: MetadataService = injector.instance[MetadataService]
//
//  val authCode =
//    "50467ac45b699eba5cdf07eb3add80b8e45de6bc"
//
//  test("test get tiktok token") {
//    val token = await(service.exchangeTikTokToken(authCode))
//    assert(token.accessToken.nonEmpty)
//  }
//
//  test("test exchange token with invalid access token") {
//    val token = service.exchangeTikTokToken("36b8801721e1c9d4222732042eb51c9540777f51")
//    assertFailedFuture[BadRequestError](token)
//  }
//
//}
