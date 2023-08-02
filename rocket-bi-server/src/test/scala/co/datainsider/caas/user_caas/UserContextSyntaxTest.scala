package co.datainsider.caas.user_caas

import co.datainsider.caas.user_profile.controller.http.filter.parser.MockUserContext
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import com.twitter.finagle.http.Request
import com.twitter.inject.Test

/**
 * created 2023-06-02 6:44 PM
 *
 * @author tvc12 - Thien Vi
 */
class UserContextSyntaxTest extends Test {
  test("get domain from request") {
    val request = Request()
    request.headerMap.put("Host", "sass.datainsider.co")
    val domain = request.getRequestDomain()
    assert(domain == "sass")
  }

  test("get domain with empty host") {
    val request = Request()
    val domain = request.getRequestDomain()
    assert(domain == "")
  }

  test("get organization from request") {
    val request = MockUserContext.getLoggedInRequest(orgId = 12, username = "tvc12")
    assert(request.isAuthenticated)
    assert(request.getOrganizationId() == 12)
    assert(request.currentUsername == "tvc12")
    assert(request.getRequestDomain() == "")
  }
}
