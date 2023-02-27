package datainsider.jobworker.client

import datainsider.jobworker.util.JsonUtils
import scalaj.http.Http

/**
  * simple http client to send request to Job-Scheduler
  */
trait HttpClient {

  def get[T: Manifest](
      endPoint: String,
      headers: Seq[(String, String)] = Seq.empty,
      params:Map[String,String]= Map.empty
  ): T

  def post[T: Manifest, A: Manifest](endPoint: String, data: A, headers: Seq[(String, String)] = Seq.empty): T

  def put[T: Manifest, A: Manifest](endPoint: String, data: A, headers: Seq[(String, String)] = Seq.empty): T

  def delete[T: Manifest](endPoint: String, headers: Seq[(String, String)] = Seq.empty): T
}

class SimpleHttpClient(apiHost: String) extends HttpClient {
  override def get[T: Manifest](
      endPoint: String,
      headers: Seq[(String, String)] = Seq.empty,
      params:Map[String,String]=Map.empty
  ): T = {
    val resp: String = Http(urlBuilder(apiHost, endPoint)).method("GET").headers(headers).asString.body
    JsonUtils.fromJson[T](resp)
  }

  override def post[T: Manifest, A: Manifest](
      endPoint: String,
      data: A,
      headers: Seq[(String, String)] = Seq.empty
  ): T = {
    val json: String = JsonUtils.toJson(data)
    val resp: String = Http(urlBuilder(apiHost, endPoint))
      .method("POST")
      .header("Content-Type", "application/json")
      .headers(headers)
      .postData(json)
      .asString
      .body
    JsonUtils.fromJson[T](resp)
  }

  override def put[T: Manifest, A: Manifest](
      endPoint: String,
      data: A,
      headers: Seq[(String, String)] = Seq.empty
  ): T = {
    val json: String = JsonUtils.toJson(data)
    val resp: String = Http(urlBuilder(apiHost, endPoint))
      .method("PUT")
      .header("Content-Type", "application/json")
      .headers(headers)
      .postData(json)
      .asString
      .body
    JsonUtils.fromJson[T](resp)
  }

  override def delete[T: Manifest](endPoint: String, headers: Seq[(String, String)] = Seq.empty): T = {
    val resp: String = Http(urlBuilder(apiHost, endPoint)).method("DELETE").headers(headers).asString.body
    JsonUtils.fromJson[T](resp)
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

}
