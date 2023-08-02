package co.datainsider.caas.user_caas.services

import com.twitter.inject.Test
import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.user_caas.domain.OAuthAuthenticationToken
import org.apache.shiro.authc.AuthenticationToken

/**
  * @author andy
  * @since 8/22/20
  */
class OAuthTest extends Test {

  test("Read Google OAuth config") {
    val config = ZConfig.getObjectList("db.oauth.supported_methods")
    println(config)
    assert(config != null)
  }

  test("Create OAuthToken with username only should ok") {
    val username = "hahaluulu"
    val token = OAuthAuthenticationToken(1L, username)

    assertResult(username)(token.getUsername)
    println(s"""
         |Username: $username
         |Token.username: ${token.getUsername}
         |""".stripMargin)

  }

  test("Create OAuthToken with username pass through function only should ok") {

    def testF(token: AuthenticationToken, username: String) = {
      println(token)
      if (token.isInstanceOf[OAuthAuthenticationToken]) {

        val u = (token.asInstanceOf[OAuthAuthenticationToken]).getUsername
        assertResult(u)(username)
        println(s"""
             |Username: $username
             |Token.username: ${u}
             |""".stripMargin)
      }
    }

    val username = "hahaluulu"
    val token = OAuthAuthenticationToken(1L, username)

    assertResult(username)(token.username)
    testF(token, username)

  }
}
