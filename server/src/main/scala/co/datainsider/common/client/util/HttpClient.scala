package co.datainsider.common.client.util

import scalaj.http
import scalaj.http.Http

object HttpClient {

  case class HttpResponse(isSuccess: Boolean, data: String)

  private val defaultHeaders = Map("content-type" -> "application/json")

  def get(
      url: String,
      params: Map[String, String] = Map.empty,
      headers: Map[String, String] = Map.empty
  ): HttpResponse = {
    val resp: http.HttpResponse[String] = Http(url)
      .params(params)
      .headers(defaultHeaders)
      .headers(headers)
      .asString

    toJsonHttpResponse(resp)
  }

  def post(
      url: String,
      data: String,
      params: Map[String, String] = Map.empty,
      headers: Map[String, String] = Map.empty
  ): HttpResponse = {
    val resp = Http(url)
      .method("POST")
      .postData(data)
      .params(params)
      .headers(defaultHeaders)
      .headers(headers)
      .asString

    toJsonHttpResponse(resp)
  }

  def put(
      url: String,
      data: String,
      params: Map[String, String] = Map.empty,
      headers: Map[String, String] = Map.empty
  ): HttpResponse = {
    val resp = Http(url)
      .method("PUT")
      .postData(data)
      .params(params)
      .headers(defaultHeaders)
      .headers(headers)
      .asString

    toJsonHttpResponse(resp)
  }

  def delete(
      url: String,
      params: Map[String, String] = Map.empty,
      headers: Map[String, String] = Map.empty
  ): HttpResponse = {
    val resp = Http(url)
      .method("DELETE")
      .params(params)
      .headers(defaultHeaders)
      .headers(headers)
      .asString

    toJsonHttpResponse(resp)
  }

  private def toJsonHttpResponse(resp: http.HttpResponse[String]): HttpResponse = {
    HttpResponse(
      isSuccess = resp.is2xx,
      data = resp.body
    )
  }
}
