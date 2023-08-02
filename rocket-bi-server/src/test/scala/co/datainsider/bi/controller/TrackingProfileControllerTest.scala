/*
package co.datainsider.bi.controller

import co.datainsider.bi.TestServer
import co.datainsider.bi.domain._
import co.datainsider.bi.domain.request._
import co.datainsider.bi.domain.response.TableResponse
import co.datainsider.bi.util.Serializer
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import org.scalatest.BeforeAndAfterAll

class TrackingProfileControllerTest extends FeatureTest with BeforeAndAfterAll {

  override val server = new EmbeddedHttpServer(new TestServer)
  private val apiPath = "/analytics/profiles"


  test("Get user profile properties list") {
    val r = server.httpGet(
      s"$apiPath/properties/list",
      andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)

    val jsonNode = Serializer.fromJson[JsonNode](response)
  }

}*/
