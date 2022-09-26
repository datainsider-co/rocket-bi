package datainsider.user_profile.controller

import datainsider.client.domain.user.LoginResult
import datainsider.login_provider.controller.DataInsiderServer
import datainsider.user_caas.service.UserService
import datainsider.user_profile.controller.http.request.{
  ChangeUserPasswordRequest,
  LoginByEmailPassRequest,
  RegisterRequest
}
import datainsider.user_profile.util.JsonParser
import org.apache.http.HttpStatus
import org.scalatest.BeforeAndAfterAll

class AdminUserControllerTest extends DataInsiderServer with BeforeAndAfterAll {

  var adminToken: Option[String] = None
  var userToken: String = null
  val username: String = "hau@gmail.com"

  override def beforeAll(): Unit = {
    super.beforeAll()
    login()
  }

  override def afterAll(): Unit = {
    super.afterAll()
    val userService: UserService = injector.instance[UserService]
    userService.deleteUser(organizationId = 1L, username = username)
  }

  test("create user") {
    val createUserRequest = JsonParser.toJson(RegisterRequest(username, "123", "trung hau"))
    val response =
      server.httpPost("/admin/users/create", postBody = createUserRequest, headers = Map("Authorization" -> getToken()))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
  }

  test("log in with user") {
    val loginData = JsonParser.toJson(LoginByEmailPassRequest(username, "123"))
    val response = server.httpPost("/user/auth/login", postBody = loginData)
    val loginResult = JsonParser.fromJson[LoginResult](response.contentString)
    userToken = loginResult.session.value
    assertResult(HttpStatus.SC_OK)(response.statusCode)
    assert(userToken.nonEmpty)
  }

  test("change password") {
    val request = JsonParser.toJson(ChangeUserPasswordRequest("123", "456", null))
    val response =
      server.httpPut("/user/profile/change_password", putBody = request, headers = Map("Authorization" -> userToken))
    assertResult(HttpStatus.SC_OK)(response.statusCode)
  }

  test("relogin with user") {
    val loginData = JsonParser.toJson(LoginByEmailPassRequest(username, "456"))
    val response = server.httpPost("/user/auth/login", postBody = loginData)
    val loginResult = JsonParser.fromJson[LoginResult](response.contentString)
    userToken = loginResult.session.value
    assertResult(HttpStatus.SC_OK)(response.statusCode)
    assert(userToken.nonEmpty)
  }

  // Todo: integrate with bi-service
//  test("delete user") {
//    val response = server.httpDelete("/admin/users/hau@gmail.com/delete", headers = Map("Authorization" -> getToken()))
//    assertResult(HttpStatus.SC_OK)(response.statusCode)
//  }
}
