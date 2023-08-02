package co.datainsider.jobworker.client

import co.datainsider.jobworker.util.JsonUtils
import datainsider.client.exception.InternalError
import scalaj.http.{Http, HttpResponse}

/**
  * simple http client to send request to Job-Scheduler
  */
trait HttpClient {

  @throws[HttpClientError]("if response status code is not 200")
  def get[T: Manifest](
      endPoint: String,
      headers: Seq[(String, String)] = Seq.empty,
      params: Seq[(String, String)] = Seq.empty
  ): T

  @throws[HttpClientError]("if response status code is not 200")
  def post[T: Manifest, A: Manifest](endPoint: String, data: A, headers: Seq[(String, String)] = Seq.empty): T

  @throws[HttpClientError]("if response status code is not 200")
  def put[T: Manifest, A: Manifest](endPoint: String, data: A, headers: Seq[(String, String)] = Seq.empty): T

  @throws[HttpClientError]("if response status code is not 200")
  def delete[T: Manifest](endPoint: String, headers: Seq[(String, String)] = Seq.empty): T
}

class HttpClientImpl(apiHost: String) extends HttpClient {
  override def get[T: Manifest](
      endPoint: String,
      headers: Seq[(String, String)] = Seq.empty,
      params: Seq[(String, String)] = Seq.empty
  ): T = {
    val resp: HttpResponse[String] = Http(urlBuilder(apiHost, endPoint)).method("GET").headers(headers).params(params).asString
    ensureSuccess(endPoint, resp)
    JsonUtils.fromJson[T](resp.body)
  }

  override def post[T: Manifest, A: Manifest](
      endPoint: String,
      data: A,
      headers: Seq[(String, String)] = Seq.empty
  ): T = {
    val json: String = JsonUtils.toJson(data)
    val resp: HttpResponse[String] = Http(urlBuilder(apiHost, endPoint))
      .method("POST")
      .header("Content-Type", "application/json")
      .headers(headers)
      .postData(json)
      .asString
    ensureSuccess(endPoint, resp)
    JsonUtils.fromJson[T](resp.body)
  }

  override def put[T: Manifest, A: Manifest](
      endPoint: String,
      data: A,
      headers: Seq[(String, String)] = Seq.empty
  ): T = {
    val json: String = JsonUtils.toJson(data)
    val resp: HttpResponse[String] = Http(urlBuilder(apiHost, endPoint))
      .method("PUT")
      .header("Content-Type", "application/json")
      .headers(headers)
      .postData(json)
      .asString
    ensureSuccess(endPoint, resp)
    JsonUtils.fromJson[T](resp.body)
  }

  override def delete[T: Manifest](endPoint: String, headers: Seq[(String, String)] = Seq.empty): T = {
    val resp: HttpResponse[String] = Http(urlBuilder(apiHost, endPoint)).method("DELETE").headers(headers).asString
    JsonUtils.fromJson[T](resp.body)
  }

  private def urlBuilder(apiHost: String, endPoint: String): String = {
    var host = ""
    var end = ""
    if (apiHost.last == '/') host = apiHost.dropRight(1)
    else host = apiHost
    if (endPoint.head == '/') end = endPoint.drop(1)
    else end = endPoint
    s"$host/$end"
  }

  private def ensureSuccess(endPoint: String, resp: HttpResponse[String]): Unit = {
    if (resp.isError) {
      throw HttpClientError(s"Request to ${endPoint} failed with status ${resp.code} and body ${resp.body}", resp.code, resp.body)
    }
  }

}
