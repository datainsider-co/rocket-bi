//package co.datainsider.schema.controller
//
//import co.datainsider.bi.TestServer
//import co.datainsider.schema.domain.requests.{
//  GetResourceSharingInfoRequest,
//  MultiUpdateResourceSharingRequest,
//  RevokeDatabasePermissionsRequest,
//  ShareWithUserRequest
//}
//import co.datainsider.schema.service.SchemaService
//import com.twitter.finagle.http.Status
//import com.twitter.finatra.http.EmbeddedHttpServer
//import com.twitter.inject.server.FeatureTest
//import datainsider.client.util.JsonParser
//
//class SchemaShareControllerTest extends FeatureTest {
//  override val server = new EmbeddedHttpServer(new TestServer)
//  val schemaService: SchemaService = injector.instance[SchemaService]
//
//  override def beforeAll(): Unit = {
//    super.beforeAll()
//    await(schemaService.ensureDatabaseCreated(1, "testdb"))
//  }
//
//  test("Test share database") {
//    val userAction = Map("test" -> Seq("view", "edit"), "trunghau" -> Seq("edit"))
//    val request = ShareWithUserRequest("testdb", userAction)
//    val result = server.httpPost(
//      path = "/databases/testdb/share",
//      andExpect = Status.Ok,
//      postBody = JsonParser.toJson(request)
//    )
//    assert(result.getContentString() != null)
//  }
//
//  test("Test get share info") {
//    val request = GetResourceSharingInfoRequest("testdb")
//    val result = server.httpGet(
//      path = "/databases/testdb/share/list",
//      andExpect = Status.Ok
//    )
//    println(result.getContentString())
//  }
//
//  test("Test update permissions") {
//    val request = MultiUpdateResourceSharingRequest("testdb", Map("s_3" -> Seq("view", "edit")))
//    val result = server.httpPut(
//      path = "/databases/testdb/share/update",
//      andExpect = Status.Ok,
//      putBody = JsonParser.toJson(request)
//    )
//    assert(result.getContentString() != null)
//  }
//
//  test("Test remove permissions") {
//    val request = RevokeDatabasePermissionsRequest("testdb", Seq("trunghau", "test"))
//    val result = server.httpDelete(
//      path = "/databases/testdb/share/revoke",
//      andExpect = Status.Ok,
//      deleteBody = JsonParser.toJson(request)
//    )
//    assert(result.getContentString() != null)
//  }
//}
