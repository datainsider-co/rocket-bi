package co.datainsider.caas.login_provider.controller

import co.datainsider.bi.TestServer
import co.datainsider.caas.login_provider.domain.{GoogleOAuthConfig, OAuthConfig, OAuthType}
import co.datainsider.caas.user_profile.controller.http.request.LoginByEmailPassRequest
import co.datainsider.caas.user_profile.util.JsonParser
import com.twitter.finatra.http.EmbeddedHttpServer
import com.twitter.inject.server.FeatureTest
import co.datainsider.caas.user_profile.domain.user.LoginResult
import org.apache.http.HttpStatus
import org.scalatest.BeforeAndAfter

trait DataInsiderServer extends FeatureTest {
  private var token: String = null
  override val server = new EmbeddedHttpServer(new TestServer())

  def getToken() = {
    token
  }

  def login(): Unit = {
    val loginData = JsonParser.toJson(LoginByEmailPassRequest("hello@gmail.com", "123456"))
    val response = server.httpPost("/user/auth/login", postBody = loginData)

    assertResult(response != null && response.contentString != null)(true)
    val loginResult = JsonParser.fromJson[LoginResult](response.contentString)
    assertResult(true)(loginResult != null)
    assertResult(true)(loginResult.session.value != null)
    token = loginResult.session.value
  }
}

case class LoginSettingTest() extends DataInsiderServer with BeforeAndAfter {
  var loginResult: LoginResult = null
  var oauthConfigAsMap: Map[String, OAuthConfig] = Map.empty
  test("Get login provider") {
    val response = server.httpGet("/user/auth/login_methods")
    assertResult(response != null && response.contentString != null)(true)
    oauthConfigAsMap = JsonParser.fromJson[Map[String, OAuthConfig]](response.contentString)
    assertResult(oauthConfigAsMap.nonEmpty)(true)
    assertResult(oauthConfigAsMap.contains(OAuthType.GOOGLE))(true)
  }
  test("Login with username password") {

    val loginData = JsonParser.toJson(LoginByEmailPassRequest("hello@gmail.com", "123456"))
    val response = server.httpPost("/user/auth/login", postBody = loginData)

    assertResult(response != null && response.contentString != null)(true)
    loginResult = JsonParser.fromJson[LoginResult](response.contentString)
    assertResult(true)(loginResult != null)
    assertResult(true)(loginResult.session.value != null)
  }

  test("Update oauth config") {
    val updateRequest = JsonParser.toJson(oauthConfigAsMap)
    val response = server.httpPut(
      "/admin/setting/login_methods",
      putBody = updateRequest,
      headers = Map("Authorization" -> loginResult.session.value)
    )
    assertResult(response != null && response.contentString != null)(true)
    assertResult(HttpStatus.SC_OK)(response.statusCode)
  }

  test("Update oauth config with whitelistEmail") {
    val updateRequest =
      JsonParser.toJson(Map(OAuthType.GOOGLE -> GoogleOAuthConfig(true, Seq("mail.com"), Set("test"))))
    val response = server.httpPut(
      "/admin/setting/login_methods",
      putBody = updateRequest,
      headers = Map("Authorization" -> loginResult.session.value)
    )
    assertResult(response != null && response.contentString != null)(true)
    assertResult(HttpStatus.SC_OK)(response.statusCode)
  }

  // Todo: token illegal, check again
//  test("Login with oauth") {
//
//    val loginData = JsonParser.toJson(
//      LoginOAuthRequest(
//        "gg",
//        "116408198991930918122",
//        "eyJhbGciOiJSUzI1NiIsImtpZCI6ImU4NzMyZGIwNjI4NzUxNTU1NjIxM2I4MGFjYmNmZDA4Y2ZiMzAyYTkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMTQ3MTIzNjMxNzYyLXAyMTQ5ZGVzb3NtcXI1OXVuN21iam0ycDY1azU2NmdoLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTQ3MTIzNjMxNzYyLXAyMTQ5ZGVzb3NtcXI1OXVuN21iam0ycDY1azU2NmdoLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTE2NDA4MTk4OTkxOTMwOTE4MTIyIiwiZW1haWwiOiJ0aGllbnZjMTIuaXRAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJUOTJqdlVHc0RueXoxaERDTEIwMFZnIiwibmFtZSI6IlZpIENoaSBUaGllbiIsInBpY3R1cmUiOiJodHRwczovL2xoNS5nb29nbGV1c2VyY29udGVudC5jb20vLXRCeFVTSG9tOGE4L0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FNWnV1Y21qWUw1UGZQSXFHNEE1bi1MWUhzZ3VYS3M3eEEvczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IlZpIENoaSIsImZhbWlseV9uYW1lIjoiVGhpZW4iLCJsb2NhbGUiOiJlbiIsImlhdCI6MTYxNDkzMDM0OSwiZXhwIjoxNjE0OTMzOTQ5LCJqdGkiOiI2NDMxMjJhY2YyZTkyYmQxYTRmMjg1NDcxYjY5Nzg2OTBmNGVlYjU1In0.raU_iZuPhnxOMMzbfOH1ovp05p8Xo_UFTaC5A2l53PhPCAh4XQYpjstYt95003CzhDUVez8eCkKszgLtO1-V0LAUkCkWF7BlHK-NyfzmCkJJsfGcmY1V8igyp0_95QqU9Q-4Q_1BgKBkbQd6a-1aLQTE4vVizAHy2YcQI3pK0dvvhdnq9Ncn11RBks4ABpbwHcEK6_eAwYzoQE7s8wofRpvrTh_uZgZBCrITXHY6ioAnanutUteI6YrhGySy1h0irq3A_mdZTXUtOkDMzZmq2nGGT6MdFtWvQaBNN8pwrvgYbAdO_IRrK4kQkzPrMLeFEawltmy0R-QynW50BpIpnw",
//        null
//      )
//    )
//    val response = server.httpPost("/user/auth/login_oauth", postBody = loginData)
//
//    assertResult(response != null && response.contentString != null)(true)
//    loginResult = JsonParser.fromJson[LoginResult](response.contentString)
//    assertResult(true)(loginResult != null)
//    assertResult(true)(loginResult.session.value != null)
//  }
}
