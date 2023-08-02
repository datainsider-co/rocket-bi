package co.datainsider.bi.controller

import co.datainsider.bi.TestServer
import co.datainsider.bi.domain.Dashboard
import co.datainsider.bi.domain.query.TableField
import co.datainsider.bi.domain.request.ListDrillThroughDashboardRequest
import co.datainsider.bi.util.Serializer
import co.datainsider.share.domain.response.PageResult
import com.twitter.finagle.http.{Response, Status}
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

  test("duplicate dashboard") {
    val request = """{"name":"load copy","parent_directory_id":-1,"widgets":[{"id":1039,"name":"","background_color":"var(--input-background-color)","text_color":"var(--text-color)","class_name":"text_widget","content":"tvc12","font_size":"12px","is_html_render":false}],"widget_positions":{"1039":{"row":-1,"column":-1,"width":5,"height":1,"z_index":1}},"directory_type":"dashboard","setting":{"version":"1","enable_overlap":false,"theme_name":"light_default"},"boost_info":{"enable":false,"schedule_time":{"recur_every":1,"at_time":1672209524542,"class_name":"schedule_daily"},"next_run_time":0}}"""
    val response: Response = server.httpPost(
      s"$apiPath/create",
      postBody = request,
      andExpect = Status.Ok
    )
    val newDashboard = Serializer.fromJson[Dashboard](response.contentString)
    assertResult(true)(newDashboard != null)
  }

}
