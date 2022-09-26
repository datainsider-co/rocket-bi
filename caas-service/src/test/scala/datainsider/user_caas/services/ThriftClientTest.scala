//package datainsider.user_caas.services
//
//import com.twitter.finagle.service.{Backoff, RetryBudget}
//import com.twitter.finagle.{Thrift, thrift}
//import com.twitter.inject.Test
//import com.twitter.util.Duration
//import datainsider.user_profile.domain.Implicits.FutureEnhanceLike
//import datainsider.user_profile.service.TUserProfileService
//
///**
//  * @author andy
//  * @since 8/22/20
//  * */
//class ThriftClientTest extends Test {
//
//  test(" should ok") {
//    val client = Thrift.client
//      .withRequestTimeout(Duration.fromSeconds(5))
//      .withSessionPool
//      .minSize(1)
//      .withSessionPool
//      .maxSize(10)
//      .withRetryBudget(RetryBudget())
//      .withRetryBackoff(
//        Backoff.exponentialJittered(
//          Duration.fromSeconds(5),
//          Duration.fromSeconds(32)
//        )
//      )
//      .withClientId(thrift.ClientId(""))
//      .build[TUserProfileService.MethodPerEndpoint](
//        s"localhost:8589",
//        ""
//      )
//
//    val res = client.checkSession("bd6df25e-0ad8-4a16-8cb1-0d195b0b7eb9").syncGet()
//
//    println(res)
//  }
//}
