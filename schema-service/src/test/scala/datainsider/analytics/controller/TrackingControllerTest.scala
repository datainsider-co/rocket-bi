//package datainsider.analytics.controller
//
//import com.twitter.finagle.http.Status
//import com.twitter.finatra.http.EmbeddedHttpServer
//import com.twitter.inject.server.FeatureTest
//import datainsider.client.util.JsonParser
//import datainsider.ingestion.TestServer
//import datainsider.ingestion.domain.ApiKeyInfo
//
//class TrackingControllerTest extends FeatureTest {
//  override val server = new EmbeddedHttpServer(new TestServer)
//
//  val adminSecretKey: String = injector.instance[String](name = "admin_secret_key")
//
//  var apiKey: String = ""
//  test("test create tracking api key") {
//    val postData =
//      s"""
//        |{
//        |  "key_type" : "tracking",
//        |  "organization_id" : 1,
//        |  "name" : "tracking key",
//        |  "admin_secret_key": "$adminSecretKey"
//        |}
//        |""".stripMargin
//
//    val r = server.httpPost(
//      path = "/analytics/api_key",
//      postBody = postData,
//      andExpect = Status.Ok
//    )
//    val response: String = r.getContentString()
//    val apiKeyInfo: ApiKeyInfo = JsonParser.fromJson[ApiKeyInfo](response)
//    assert(apiKeyInfo != null)
//    apiKey = apiKeyInfo.apiKey
//  }
//
//  test("test single event tracking") {
//    Thread.sleep(5000) // wait for consumer to start
//    val postData =
//      s"""
//         |{
//         |  "tracking_api_key" : "$apiKey",
//         |  "event" : "checkout",
//         |  "properties" : {
//         |    "item" : "iphone",
//         |    "price" : 999.0
//         |  }
//         |}
//         |""".stripMargin
//
//    val r = server.httpPost(
//      path = "/tracking/track",
//      postBody = postData,
//      andExpect = Status.Ok
//    )
//    val response: String = r.getContentString()
//    assert(response == """{"success":true}""")
//
//    Thread.sleep(5000) // wait for consumer to consume
//
//  }
//
//  test("test batch tracking events") {
//    Thread.sleep(5000) // wait for consumer to start
//    val postData =
//      s"""
//        |{
//        |  "tracking_api_key" : "$apiKey",
//        |  "events" : [ {
//        |    "name" : "crash5",
//        |    "properties" : {
//        |      "screen" : "home",
//        |      "at_time" : 1633579884000
//        |    }
//        |  }, {
//        |    "name" : "crash5",
//        |    "properties" : {
//        |      "screen" : "login",
//        |      "duration" : 1633579883000
//        |    }
//        |  } ]
//        |}
//        |""".stripMargin
//
//    val r = server.httpPost(
//      path = "/tracking/events/track",
//      postBody = postData,
//      andExpect = Status.Ok
//    )
//    val response: String = r.getContentString()
//    assert(response == """{"success":true}""")
//
//    Thread.sleep(5000) // wait for consumer to consume
//
//  }
//
//  test("test delete api key") {
//    val r = server.httpDelete(
//      path = s"/analytics/api_key/$apiKey?admin_secret_key=$adminSecretKey",
//      andExpect = Status.Ok
//    )
//    val resp = r.getContentString()
//    assert(resp == """{"success":true}""")
//  }
//
//}
