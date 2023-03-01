package datainsider.jobscheduler.controller

import com.twitter.finagle.http.{Response, Status}
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import datainsider.client.util.JsonParser
import datainsider.jobscheduler.TestServer
import datainsider.jobscheduler.domain.{DataSource, GoogleAdsSource}

class DataSourceControllerTest extends FeatureTest {

  override protected def server = new EmbeddedHttpServer(twitterServer = new TestServer)
  var currentDataSource: DataSource = _

  test("create data source") {
    val response: Response = server.httpPost(
      path = "/source/create",
      postBody = """{
                   |    "data_source": {
                   |        "class_name": "jdbc_source",
                   |        "id": -1,
                   |        "org_id": "-1",
                   |        "display_name": "dev",
                   |        "database_type": "Vertica",
                   |        "jdbc_url": "jdbc:vertica://vertica:4436/",
                   |        "username": "tvc12",
                   |        "password": "123456",
                   |        "last_modify": 0
                   |    }
                   |}""".stripMargin,
      andExpect = Status.Ok,
      headers = Map("Access-Token" -> "job$cheduler@datainsider.co")
    )
    val dataSource: Option[DataSource] = JsonParser.fromJson[Option[DataSource]](response.contentString)
    assert(dataSource.isDefined == true)
    currentDataSource = dataSource.get
  }

  test("listing source") {
    val response: Response = server.httpPost(
      path = "/source/list",
        postBody =
          """{
            | "sorts": [],
            | "from": 0,
            | "size": 20
            |}""".stripMargin,
      andExpect = Status.Ok,
      headers = Map("Access-Token" -> "job$cheduler@datainsider.co")
    )
    val result: Map[String, Any] = JsonParser.fromJson[Map[String, Any]](response.contentString)
    assert(result != null)
    println(result)
  }
}
