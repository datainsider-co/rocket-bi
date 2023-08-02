package co.datainsider.bi.controller

import co.datainsider.bi.TestServer
import co.datainsider.bi.domain.Directory
import co.datainsider.bi.domain.response.{DirectoryResponse, PaginationResponse}
import co.datainsider.bi.util.Serializer
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finagle.http.Status
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import org.scalatest.BeforeAndAfterAll

class DirectoryControllerTest extends FeatureTest with BeforeAndAfterAll {

  override val server = new EmbeddedHttpServer(new TestServer)

  var rootId: Long = -1
  var dirId: Long = -1
  test("test get or create root directory") {
    val r = server.httpGet("/directories/root", andExpect = Status.Ok)
    val response = r.getContentString()
    assert(response != null)

    val instance = Serializer.fromJson[JsonNode](response)
    rootId = instance.at("/id").toString.toLong
  }

  test("test create directory inside root dir") {
    val r = server.httpPost(
      "/directories/create",
      postBody = s"""
          |{
          |  "name":"child",
          |  "is_removed":false,
          |  "parent_id":$rootId,
          |  "directory_type":"directory"
          |}
          |""".stripMargin,
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(response != null)

    val dirResponse = Serializer.fromJson[DirectoryResponse](response)
    assert(dirResponse != null)
    println(dirResponse)
    dirId = dirResponse.id
  }

  test("test star directory") {
    val r = server.httpPost(
      s"/directories/$dirId/star",
      postBody = "",
      andExpect = Status.Ok
    )
  }

  test("test list child directories") {
    val r = server.httpPost(
      s"/directories/$rootId/list",
      postBody = """{
                   |  "directory_type":"directory",
                   |  "sorts":[{"field":"name","order":"ASC"}],
                   |  "from":0,
                   |  "size":10000
                   |}""".stripMargin,
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(response != null)

    val dirResponses = Serializer.fromJson[Array[DirectoryResponse]](response)
    assert(dirResponses.nonEmpty)

  }

  test("test quick list directories") {
    val r = server.httpPost(
      s"/directories/quick_list",
      postBody = """
                   |{
                   |  "directory_type":"directory",
                   |  "owner_id" : "test@gmail.com",
                   |  "sorts":[{"field":"name","order":"ASC"}],
                   |  "from":0,
                   |  "size":10000
                   |}
                   |""".stripMargin,
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(response != null)

    val dirResponses = Serializer.fromJson[PaginationResponse[Directory]](response)
    assert(dirResponses.data.nonEmpty)

  }

  test("test remove directory") {
    val r = server.httpPut(
      s"/directories/$dirId/remove",
      putBody = "",
      andExpect = Status.Ok
    )
  }

  test("test list trash root") {
    val r = server.httpPost(
      "/directories/trash",
      postBody = """
          |{
          |"from": 0,
          |"size": 1000
          |}
          |""".stripMargin,
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(response != null)
  }

  test("test list trash with directory id") {
    val r = server.httpPost(
      s"/directories/trash/$dirId",
      postBody = """
          |{
          |"from": 0,
          |"size": 1000
          |}
          |""".stripMargin,
      andExpect = Status.Ok
    )
  }

  test("restore directory") {
    val r = server.httpPut(
      s"/directories/$dirId/restore",
      putBody = "",
      andExpect = Status.Ok
    )
  }

  test("list starred directory") {
    val r = server.httpPost(
      "/directories/star",
      postBody = """
          |{
          |"from": 0,
          |"size": 1000
          |}
          |""".stripMargin,
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(response != null)
  }

  test("remove star directory") {
    val r = server.httpPost(
      s"/directories/$dirId/unstar",
      postBody = "",
      andExpect = Status.Ok
    )
  }

  test("List recent") {
    val r = server.httpPost(
      s"/directories/recent",
      postBody = """
          |{
          |"from": 0,
          |"size": 1000
          |}
          |""".stripMargin,
      andExpect = Status.Ok
    )
    val response = r.getContentString()
    assert(response != null)
  }

//  test("delete root") {
//    server.httpPut(
//      s"/directories/$rootId/remove",
//      putBody = "",
//      andExpect = Status.Ok
//    )
//  }
//
//  test("delete trash") {
//    server.httpDelete(
//      s"/directories/trash/$rootId/delete"
//    )
//  }
}
