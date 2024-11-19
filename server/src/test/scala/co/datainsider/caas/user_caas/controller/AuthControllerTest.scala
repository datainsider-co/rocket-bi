package co.datainsider.caas.user_caas.controller

import co.datainsider.bi.util.Serializer
import co.datainsider.caas.login_provider.controller.DataInsiderServer
import com.twitter.finagle.http.Response

/**
 * created 2023-06-26 12:00 PM
 *
 * @author tvc12 - Thien Vi
 */
 class AuthControllerTest extends DataInsiderServer {

  test("test status forgot password code failed") {
    val response: Response = server.httpPost("/user/auth/123456/status", """{"email": "hello@gmail.com"}""")
    val result = Serializer.fromJson[Map[String, Any]](response.contentString)
    assert(result("success") == false)
  }
}
