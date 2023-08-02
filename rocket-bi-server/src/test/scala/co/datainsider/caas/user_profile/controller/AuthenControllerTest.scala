//package xed.user_authen.controller.http
//
//import com.fasterxml.jackson.databind.JsonNode
//import com.twitter.finagle.thrift.ThriftClient
//import com.twitter.com.twitter.finatra.http.EmbeddedHttpServer
//import com.twitter.inject.server.FeatureTest
//import datainsider.user_profile.TestServer
//import datainsider.user_profile.util.JsonParser
//
//
///**
// * @author anhlt
// */
//class AuthenOAuthenTest extends FeatureTest {
//  override protected val server = new EmbeddedHttpServer(twitterServer = new TestServer) with ThriftClient
//  val users = scala.collection.mutable.Map[String, String]()
//
//
//  test("Register") {
//    val response = server.httpGet("/user/auth/register", headers = Map(
//    ))
//
//    val json = JsonParser.fromJson[JsonNode](response.contentString)
//  }
//
//}
