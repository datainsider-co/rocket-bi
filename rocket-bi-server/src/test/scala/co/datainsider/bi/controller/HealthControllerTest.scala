package co.datainsider.bi.controller

import co.datainsider.bi.TestServer
import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest

/**
  * Created by SangDang on 9/18/16.
  */
class HealthControllerTest extends FeatureTest {

  override val server = new EmbeddedHttpServer(new TestServer)

  test("Test Health Http") {
    server.isHealthy

    server.httpGet(path = "/ping", andExpect = Status.Ok, withJsonBody =
      """
        {
          "status":"ok",
          "data":"pong"
        }
      """.stripMargin)

  }
}