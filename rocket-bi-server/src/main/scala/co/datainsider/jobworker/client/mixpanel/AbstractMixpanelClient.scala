package co.datainsider.jobworker.client.mixpanel

import co.datainsider.jobworker.client.HttpClientError
import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.util.JsonParser
import scalaj.http.{Http, HttpResponse}

import java.nio.file.{Files, Path}
import java.util.Base64
import javax.ws.rs.core.UriBuilder

abstract class AbstractMixpanelClient(
    accountUsername: String,
    accountSecret: String
) extends MixpanelClient {

  protected def getApiUrl(): String

  protected def getExportUrl(): String

  protected def getProfileUrl(): String = "https://mixpanel.com/"

  private def getCommonHeaders(): Seq[(String, String)] = {
    val token = Base64.getEncoder.encodeToString(s"$accountUsername:$accountSecret".getBytes("UTF-8"))
    Seq(
      ("Accept", "application/json"),
      ("Authorization", s"Basic ${token}")
    )
  }

  override def getEngagement(request: GetEngagementRequest): EngagementResponse = {
    val params = Map("project_id" -> request.projectId)
    val path = urlBuilder(getApiUrl(), "/api/query/engage", params)
    val headers = Seq(("Content-Type", "application/x-www-form-urlencoded"))
    val formData: Map[String, String] = Map(
      "session_id" -> request.sessionId,
      "page" -> request.page
    ).filter(_._2.isDefined).mapValues(_.get.toString)

    val data: String = toString(formData)
    val response: EngagementResponse = post[EngagementResponse](path = path, data = data, headers = headers)
    response
  }

  override def export(request: ExportRequest): Path = {
    val destPath: Path = Files.createTempFile("mixpanel-export", ".jsonl")

    try {
      val params = Map(
        "project_id" -> request.projectId,
        "from_date" -> request.fromDate.toString,
        "to_date" -> request.toDate.toString
      )
      val path = urlBuilder(getExportUrl(), "/api/2.0/export", params)

      val headers = Seq(
        ("Accept", "text/plain"),
        ("Content-Encoding", "gzip")
      )

      val response: HttpResponse[Path] = Http(path)
        .method("GET")
        .headers(getCommonHeaders())
        .headers(headers)
        .compress(true)
        .execute(parser = (is) => {
          Files.copy(is, destPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING)
          destPath
        })
      ensureSuccess(path, response)
      response.body
    } catch {
      case ex: Throwable =>
        Files.deleteIfExists(destPath)
        throw ex
    }
  }

  private def toString(formData: Map[String, Any]): String = {
    formData
      .map {
        case (key, value) => s"$key=$value"
      }
      .mkString("&")
  }

  override def getProfile(): MixpanelResponse[JsonNode] = {
    val path = urlBuilder(getProfileUrl(), "/api/app/me")
    val response: HttpResponse[String] = Http(path)
      .method("GET")
      .headers(getCommonHeaders())
      .asString
    ensureSuccess(path, response)
    JsonParser.fromJson[MixpanelResponse[JsonNode]](response.body)
  }

  private def post[T: Manifest](path: String, data: String, headers: Seq[(String, String)]): T = {
    val response: HttpResponse[String] = Http(path)
      .method("POST")
      .headers(getCommonHeaders())
      .headers(headers)
      .postData(data)
      .asString
    ensureSuccess(path, response)
    JsonParser.fromJson[T](response.body)
  }

  private def ensureSuccess(path: String, response: HttpResponse[_]): Unit = {
    if (response.isError) {
      throw new HttpClientError(
        s"call to $path fail with code: ${response.code}, message: ${response.body}",
        response.code,
        String.valueOf(response.body)
      )
    }
  }

  /**
    * Normalize url with apiHost and endPoint
    */
  private def urlBuilder(apiHost: String, endPoint: String, queryParams: Map[String, String] = Map.empty): String = {
    val uriBuilder: UriBuilder = UriBuilder.fromUri(apiHost).path(endPoint)
    queryParams.foreach {
      case (key, value) => uriBuilder.queryParam(key, value)
    }

    uriBuilder.build().toString
  }

}
