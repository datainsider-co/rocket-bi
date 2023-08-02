//package co.datainsider.jobscheduler.controller
//
//import co.datainsider.bi.TestServer
//import co.datainsider.bi.util.ZConfig
//import co.datainsider.jobscheduler.domain.source.DataSource
//import com.twitter.finagle.http.{Response, Status}
//import com.twitter.finatra.http.EmbeddedHttpServer
//import com.twitter.inject.server.FeatureTest
//import datainsider.client.util.JsonParser
//
//class DataSourceControllerTest extends FeatureTest {
//
//  var currentDataSource: DataSource = _
//
//  override protected val server = new EmbeddedHttpServer(twitterServer = new TestServer)
//  val accessToken = ZConfig.getString("schedule_service.access_token")
//
//  test("create data source") {
//    val response: Response = server.httpPost(
//      path = "/source/create",
//      postBody = """{
//                   |    "data_source": {
//                   |        "class_name": "jdbc_source",
//                   |        "id": -1,
//                   |        "org_id": "-1",
//                   |        "display_name": "dev",
//                   |        "database_type": "Vertica",
//                   |        "jdbc_url": "jdbc:vertica://vertica:4436/",
//                   |        "username": "tvc12",
//                   |        "password": "123456",
//                   |        "last_modify": 0
//                   |    }
//                   |}""".stripMargin,
//      andExpect = Status.Ok,
//      headers = Map("Access-Token" -> accessToken)
//    )
//    val dataSource: Option[DataSource] = JsonParser.fromJson[Option[DataSource]](response.contentString)
//    assert(dataSource.isDefined == true)
//    currentDataSource = dataSource.get
//  }
//
//  test("listing source") {
//    val response: Response = server.httpPost(
//      path = "/source/list",
//      postBody = """{
//            | "sorts": [],
//            | "from": 0,
//            | "size": 20
//            |}""".stripMargin,
//      andExpect = Status.Ok,
//      headers = Map("Access-Token" -> accessToken)
//    )
//    val result: Map[String, Any] = JsonParser.fromJson[Map[String, Any]](response.contentString)
//    assert(result != null)
//    println(result)
//  }
//
//  override def afterAll(): Unit = {
//    server.close()
//  }
//}
