//package co.datainsider.bi.controller
//
//import co.datainsider.bi.TestServer
//import co.datainsider.bi.util.Using
//import com.twitter.finagle.http.Status
//import com.twitter.finatra.http.EmbeddedHttpServer
//import com.twitter.inject.server.FeatureTest
//
//import scala.io.Source
//
//class UserActivityLogTest extends FeatureTest {
//  override val server = new EmbeddedHttpServer(new TestServer)
//
//  test("test log user activity case success") {
//    server.httpPost(path = "/status", postBody = "test_log")
//    val activityLogPath: String = "./logs/activity.log"
//    Using(Source.fromFile(activityLogPath)) { reader =>
//      val lines = reader.getLines()
//      val lastLine = lines.foldLeft(Option.empty[String]) { case (_, line) => Some(line) }.get
//      val Array(
//        datetime,
//        username,
//        requestMethod,
//        requestURI,
//        requestContent,
//        responseCode,
//        executeTime,
//        message
//      ) = lastLine.split("\t")
//      assert(datetime.nonEmpty)
//      assert(username.equals("test@gmail.com"))
//      assert(requestMethod.equals("POST"))
//      assert(requestURI.equals("/status"))
//      assert(requestContent.equals("test_log"))
//      assert(responseCode.toInt.equals(200))
//      assert(executeTime.nonEmpty)
//    }
//  }
//
//  test("test log user activity case fail") {
//    server.httpPost(path = "/query/sql", postBody = "{\"sql\": \"select\"}")
//    val activityLogPath: String = "./logs/activity.log"
//    Using(Source.fromFile(activityLogPath)) { reader =>
//      val lines = reader.getLines()
//      val lastLine = lines.foldLeft(Option.empty[String]) { case (_, line) => Some(line) }.get
//      val Array(
//      datetime,
//      username,
//      requestMethod,
//      requestURI,
//      requestContent,
//      responseCode,
//      executeTime,
//      message
//      ) = lastLine.split("\t")
//      assert(datetime.nonEmpty)
//      assert(username.equals("test@gmail.com"))
//      assert(requestMethod.equals("POST"))
//      assert(requestURI.equals("/query/sql"))
//      assert(requestContent.nonEmpty)
//      assert(responseCode.toInt.equals(500))
//      assert(executeTime.nonEmpty)
//      assert(message.nonEmpty)
//    }
//  }
//}
