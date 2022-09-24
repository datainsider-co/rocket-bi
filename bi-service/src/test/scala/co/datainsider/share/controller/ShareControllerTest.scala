/*
package co.datainsider.share.controller

import co.datainsider.share.controller.request.{MultiUpdateResourceSharingRequest, RevokeShareRequest, ShareAnyoneRequest, ShareWithUserRequest, UpdateShareAnyoneRequest}
import datainsider.client.util.JsonParser
import org.apache.http.HttpStatus

class ShareControllerTest extends BaseControllerTest {
  val apiPath = "/share/dashboard/156"
  test("Get users sharing") {
    val response = server.httpGet(s"${apiPath}?from=0&size=20")

    assertResult(HttpStatus.SC_OK)(response.statusCode)
  }

  test("Share user") {
    val data = JsonParser.toJson(ShareWithUserRequest("", "", Map("tvc12" -> Seq("view", "edit"))))
    val response = server.httpPost(s"${apiPath}", postBody = data)

    assertResult(HttpStatus.SC_OK)(response.statusCode)
  }

  test("Update permission") {
    val body = MultiUpdateResourceSharingRequest("dashboard", "123", Map("123" -> Seq("view", "edit")), null)
    val response = server.httpPut(s"${apiPath}/edit", putBody = JsonParser.toJson(body))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
  }

  test("Revoke share") {
    val body = RevokeShareRequest("", "", Seq("tvc12"))
    val resp = server.httpDelete(s"${apiPath}/revoke", deleteBody = JsonParser.toJson(body))
    assertResult(HttpStatus.SC_OK)(resp.statusCode)
  }

  test("Get share anyone info") {
    val resp = server.httpGet(s"${apiPath}/anyone")
    assertResult(HttpStatus.SC_OK)(resp.statusCode)
  }

  test("Share anyone") {
    val body = JsonParser.toJson(ShareAnyoneRequest("", "", Seq("view", "edit")))
    val resp = server.httpPost(s"${apiPath}/anyone", postBody = body)
    assertResult(HttpStatus.SC_OK)(resp.statusCode)
  }


  test("Update share anyone link") {
    val body = JsonParser.toJson(new UpdateShareAnyoneRequest("", "", Seq("view", "edit")))
    val resp = server.httpPut(s"${apiPath}/anyone", putBody = body)
    assertResult(HttpStatus.SC_OK)(resp.statusCode)
  }

  test("Revoke anyone") {
    val resp = server.httpDelete(s"${apiPath}/anyone/revoke")
    assertResult(HttpStatus.SC_OK)(resp.statusCode)
  }
}
*/
