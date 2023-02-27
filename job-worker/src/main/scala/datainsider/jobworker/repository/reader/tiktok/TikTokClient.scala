package datainsider.jobworker.repository.reader.tiktok

import datainsider.jobworker.client.HttpClient
import datainsider.jobworker.util.JsonUtils
import scalaj.http.{Http, HttpRequest, HttpResponse}

class TikTokClient(baseUrl: String, accessToken: String) extends HttpClient {

  private val baseHeaders: Seq[(String, String)] =
    Seq("Access-Token" -> accessToken, "Content-Type" -> "application/json")

  override def get[T: Manifest](
      endPoint: String,
      headers: Seq[(String, String)],
      params: Map[String, String]
  ): T = {
    val url = urlBuilder(baseUrl, endPoint)
    val request: HttpRequest = Http(url)
      .headers(baseHeaders)
      .headers(headers)
      .method("GET")
      .params(params)
    val response: HttpResponse[String] = request.execute()
    JsonUtils.fromJson[T](response.body)

  }

  override def post[T: Manifest, A: Manifest](endPoint: String, data: A, headers: Seq[(String, String)]): T = {
    val json: String = JsonUtils.toJson(data)
    val resp: String = Http(urlBuilder(baseUrl, endPoint))
      .method("POST")
      .header("Content-Type", "application/json")
      .headers(headers)
      .postData(json)
      .asString
      .body
    JsonUtils.fromJson[T](resp)
  }

  override def put[T: Manifest, A: Manifest](endPoint: String, data: A, headers: Seq[(String, String)]): T = ???

  override def delete[T: Manifest](endPoint: String, headers: Seq[(String, String)]): T = ???

  private def urlBuilder(apiHost: String, endPoint: String): String = {
    val host =
      if (apiHost.last == '/') apiHost.dropRight(1)
      else apiHost
    val end =
      if (endPoint.head == '/') endPoint.drop(1)
      else endPoint
    s"$host/$end/"
  }
}
