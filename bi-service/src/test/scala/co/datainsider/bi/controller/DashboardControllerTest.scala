package co.datainsider.bi.controller

import co.datainsider.bi.TestServer
import co.datainsider.bi.domain.Dashboard
import co.datainsider.bi.domain.query.TableField
import co.datainsider.bi.domain.request.ListDrillThroughDashboardRequest
import co.datainsider.bi.util.Serializer
import co.datainsider.share.domain.response.PageResult
import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import org.scalatest.BeforeAndAfterAll

class DashboardControllerTest extends FeatureTest with BeforeAndAfterAll {

  override val server = new EmbeddedHttpServer(new TestServer)
  private val apiPath = "/dashboards"

  test("List Dashboards For Drill Through") {
    server.isHealthy
    val request = ListDrillThroughDashboardRequest(
      fields = Array(TableField("animal", "cat", "name", "string")),
      excludeIds = Array(1, 2, 3, 4),
      isRemoved = Some(false),
      from = 1,
      size = 100
    )
    println(Serializer.toJson(request))

    val response = server.httpPost(
      s"$apiPath/list_drill_through",
      postBody = Serializer.toJson(request),
      andExpect = Status.Ok
    )
    assertResult(true)(response.contentString != null)
    val pageResult = Serializer.fromJson[PageResult[Dashboard]](response.contentString)
    assertResult(true)(pageResult != null)
  }

}
