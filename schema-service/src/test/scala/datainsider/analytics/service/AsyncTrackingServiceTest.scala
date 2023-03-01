//package datainsider.analytics.service
//
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import datainsider.analytics.controller.http.request.BatchTrackingRequest
//import datainsider.analytics.domain.commands.{EventBatch, TrackingEvent}
//import datainsider.analytics.module.TrackingModule
//import datainsider.analytics.service.tracking.AsyncTrackingService
//import datainsider.client.domain.Implicits.FutureEnhanceLike
//import datainsider.client.module.MockCaasClientModule
//import datainsider.client.util.JsonParser
//import datainsider.ingestion.module.{ActorModule, MainModule, MockMainModule, ShareModule}
//import datainsider.module.{MockHadoopFileClientModule, MockTrackingClient}
//import org.nutz.ssdb4j.spi.SSDB
//
//class AsyncTrackingServiceTest extends IntegrationTest {
//
//  override val injector: Injector =
//    TestInjector(
//      MockMainModule,
//      ActorModule,
//      TrackingModule,
//      MockCaasClientModule,
//      MockHadoopFileClientModule,
//      MockTrackingClient
//    ).newInstance()
//  val trackingService: AsyncTrackingService = injector.instance[AsyncTrackingService]
//
//  test("test consume tracking event") {
//
//    trackingService.startTrackingWorkers()
//    Thread.sleep(5000) // wait for consumer to start
//  }
//
//  test("test track events") {
//    val eventBatch = EventBatch(
//      orgId = 1L,
//      trackingApiKey = "abc",
//      timestamp = System.currentTimeMillis(),
//      events = Seq(
//        TrackingEvent(name = "crash7", properties = Map("screen" -> "home", "at_time" -> 1633579884000L)),
//        TrackingEvent(name = "crash7", properties = Map("screen" -> "login", "duration" -> 1633579883000L))
//      )
//    )
//    println(JsonParser.toJson(eventBatch))
//    val success: Boolean = trackingService.track(eventBatch).syncGet
//    println(success)
//    Thread.sleep(5000) // wait for consumer to consume
//  }
//
//}
