/*
package co.datainsider.share.controller

import co.datainsider.bi.TestServer
import co.datainsider.bi.domain.PermissionToken
import co.datainsider.bi.util.Serializer
import co.datainsider.share.controller.request.{CheckTokenPermittedAllRequest, CheckTokenPermittedRequest, GetOrCreatePermissionTokenRequest, UpdatePermissionTokenRequest}
import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import org.scalatest.BeforeAndAfterAll

class PermissionTokenControllerTest extends BaseControllerTest with BeforeAndAfterAll {

  private val apiPath = "/permission_tokens"

  var dashboardId: Long = 1
  var tokenId: String = ""

  test("create token") {
    val request = GetOrCreatePermissionTokenRequest("dashboard", dashboardId.toString, None, null)

    val r = server.httpPost(
      s"$apiPath",
      Serializer.toJson(request),
      andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)

    tokenId = response
    assert(tokenId != null)
  }


  test("get token info") {

    val r = server.httpGet(s"$apiPath/$tokenId", andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)

    assert(Serializer.fromJson[PermissionToken](response) != null)
  }

  test("should not permit for any actions") {

    val request = CheckTokenPermittedRequest(tokenId, Seq("dashboard:1:view", "dashboard:1:view", "dashboard:1:view,edit,delete"))

    val r = server.httpPost(
      s"$apiPath/$tokenId/permitted",
      Serializer.toJson(request),
      andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)

    assert(Serializer.fromJson[Seq[Boolean]](response) != null)
    assert(Serializer.fromJson[Seq[Boolean]](response).filter(_ == true).isEmpty)
  }

  test("should not permit all for any actions") {

    val request = CheckTokenPermittedAllRequest(tokenId, Seq("dashboard:1:view", "dashboard:1:view", "dashboard:1:view,edit,delete"))

    val r = server.httpPost(
      s"$apiPath/$tokenId/permitted_all",
      Serializer.toJson(request),
      andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)
    assert(response.toBoolean == false)
  }

  test("update perms") {
    val request = UpdatePermissionTokenRequest(tokenId, Seq(s"dashboard:$dashboardId:view"))

    val r = server.httpPut(
      s"$apiPath/$tokenId",
      Serializer.toJson(request),
      andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)
    assert(response.toBoolean)
  }


  test("should  permit to view") {

    val request = CheckTokenPermittedRequest(tokenId, Seq("dashboard:1:view", "dashboard:1:view", "dashboard:1:view,edit,delete"))

    val r = server.httpPost(
      s"$apiPath/$tokenId/permitted",
      Serializer.toJson(request),
      andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)

    assert(Serializer.fromJson[Seq[Boolean]](response) != null)
    assert(Serializer.fromJson[Seq[Boolean]](response).filter(_ == true).nonEmpty)
  }

  test("should permit all") {

    val request = CheckTokenPermittedAllRequest(tokenId, Seq("dashboard:1:view"))

    val r = server.httpPost(
      s"$apiPath/$tokenId/permitted_all",
      Serializer.toJson(request),
      andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)
    assert(response.toBoolean)
  }


  test("get token info after update perms") {

    val r = server.httpGet(s"$apiPath/$tokenId", andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)

    assert(Serializer.fromJson[PermissionToken](response) != null)
    assert(Serializer.fromJson[PermissionToken](response).permissions != null)
    assert(Serializer.fromJson[PermissionToken](response).permissions.nonEmpty)
  }

  test("delete token") {
    val r = server.httpDelete(s"$apiPath/$tokenId", andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)
  }


}
*/
