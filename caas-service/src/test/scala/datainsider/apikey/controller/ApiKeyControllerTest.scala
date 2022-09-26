package datainsider.apikey.controller

import datainsider.apikey.domain.request.ListApiKeyRequest
import datainsider.apikey.domain.response.{ApiKeyResponse, ListApiKeyResponse}
import datainsider.login_provider.controller.DataInsiderServer
import datainsider.user_profile.util.JsonParser
import org.apache.http.HttpStatus

class ApiKeyControllerTest extends DataInsiderServer {
  override def beforeAll(): Unit = {
    super.beforeAll()
    login()
  }

  var apiKey: String = ""
  test("create api key test") {
    val requestBody =
      """{
        |  "display_name": "test api key",
        |  "expired_time_ms": 100000,
        |  "permissions": [
        |   "directory:*:*"
        |  ]
        |}""".stripMargin
    val response =
      server.httpPost("/apikey", postBody = requestBody, headers = Map("Authorization" -> getToken()))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
    val apiKeyResponse: ApiKeyResponse = JsonParser.fromJson[ApiKeyResponse](response.contentString)
    println(apiKeyResponse)
    apiKey = apiKeyResponse.apiKeyInfo.apiKey
  }

  test("get api key test") {
    val response = server.httpGet(s"/apikey/$apiKey", headers = Map("Authorization" -> getToken()))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
    val apiKeyResponse: ApiKeyResponse = JsonParser.fromJson[ApiKeyResponse](response.contentString)
    println(apiKeyResponse)
    assert(apiKeyResponse.apiKeyInfo.apiKey.equals(apiKey))
  }

  test("list api key test") {
    val requestBody: String = JsonParser.toJson(ListApiKeyRequest(request = null))
    val response =
      server.httpPost("/apikey/list", postBody = requestBody, headers = Map("Authorization" -> getToken()))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
    val listApiKeyResponse: ListApiKeyResponse = JsonParser.fromJson[ListApiKeyResponse](response.contentString)
    println(listApiKeyResponse)
    assert(listApiKeyResponse.total.equals(1L))
    assert(listApiKeyResponse.data.head.apiKey.equals(apiKey))
  }

  test("get api key permissions test") {
    val response = server.httpGet(s"/apikey/$apiKey", headers = Map("Authorization" -> getToken()))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
    val apiKeyResponse: ApiKeyResponse = JsonParser.fromJson[ApiKeyResponse](response.contentString)
    println(apiKeyResponse)
    assert(apiKeyResponse.permissions.contains("0:directory:*:*"))
  }

  test("update api key test") {
    val requestBody: String =
      """{
        |  "display_name": "test api key",
        |  "expired_time_ms": 100000,
        |  "include_permissions": [
        |     "database:*:*"
        |  ],
        |  "exclude_permissions": []
        |}""".stripMargin

    val response = server.httpPut(
      s"/apikey/$apiKey",
      putBody = requestBody,
      headers = Map("Authorization" -> getToken())
    )
    assertResult(HttpStatus.SC_OK)(response.statusCode)
  }

  test("get updated api key permissions test") {
    val response = server.httpGet(s"/apikey/$apiKey", headers = Map("Authorization" -> getToken()))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
    val apiKeyResponse: ApiKeyResponse = JsonParser.fromJson[ApiKeyResponse](response.contentString)
    println(apiKeyResponse)
    assert(apiKeyResponse.permissions.contains("0:database:*:*"))
  }

  test("delete api key test") {
    val response = server.httpDelete(s"/apikey/$apiKey", headers = Map("Authorization" -> getToken()))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
  }

  test("create api key added(created_by,updated_by,updated_At) field test") {
    val requestBody =
      """{
        |  "display_name": "test api key",
        |  "expired_time_ms": 100000,
        |  "permissions": [
        |   "directory:*:*"
        |  ]
        |}""".stripMargin
    val response =
      server.httpPost("/apikey", postBody = requestBody, headers = Map("Authorization" -> getToken()))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
    val apiKeyResponse: ApiKeyResponse = JsonParser.fromJson[ApiKeyResponse](response.contentString)
    assert(apiKeyResponse.apiKeyInfo.createdBy.get.equals("root"))
    assert(apiKeyResponse.apiKeyInfo.updatedBy.get.equals("root"))
    assert(apiKeyResponse.apiKeyInfo.createdAt == apiKeyResponse.apiKeyInfo.updatedAt)
    println(apiKeyResponse)
    apiKey = apiKeyResponse.apiKeyInfo.apiKey
  }

  test("update api key with(created_by,updated_by,updated_at) fields test") {
    val requestBody: String =
      """{
        |  "display_name": "new api key",
        |  "expired_time_ms": 100000,
        |  "include_permissions": [
        |     "database:*:*"
        |  ],
        |  "exclude_permissions": []
        |}""".stripMargin

    val response = server.httpPut(
      s"/apikey/$apiKey",
      putBody = requestBody,
      headers = Map("Authorization" -> getToken())
    )
    assertResult(HttpStatus.SC_OK)(response.statusCode)
    val response1 = server.httpGet(s"/apikey/$apiKey", headers = Map("Authorization" -> getToken()))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
    val apiKeyResponse: ApiKeyResponse = JsonParser.fromJson[ApiKeyResponse](response1.contentString)
    assert(apiKeyResponse.apiKeyInfo.createdAt < apiKeyResponse.apiKeyInfo.updatedAt)
    assert(apiKeyResponse.apiKeyInfo.displayName.equals("new api key"))
    assert(apiKeyResponse.apiKeyInfo.expiredTimeMs == 100000)
    assert(apiKeyResponse.permissions.contains("0:database:*:*"))
    assert(apiKeyResponse.permissions.contains("0:directory:*:*"))

  }
  test("delete api key with (updated_by,created_by,updated_at) test") {
    val response = server.httpDelete(s"/apikey/$apiKey", headers = Map("Authorization" -> getToken()))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
  }

}
