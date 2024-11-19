package co.datainsider.caas.login_provider.service

import co.datainsider.caas.user_profile.util.Utils
import com.twitter.inject.Test

class WhitelistEmailTest extends Test {
  test("Test email in whitelist") {
    val email = "meomeocf98@gmail.com"
    val whitelistEmailTest = Seq("gmail.com", "email.com")

    val r = Utils.isWhitelistEmail(email, whitelistEmailTest)
    assertResult(true)(r)
  }

  test("Test email not in whitelist") {
    val email = "meomeocf98@gmail.com"
    val whitelistEmailTest = Seq("mail.com", "email.com")

    val r = Utils.isWhitelistEmail(email, whitelistEmailTest)
    assertResult(false)(r)
  }

  test("Test email with whitelist empty") {
    val email = "meomeocf98@gmail.com"
    val whitelistEmailTest = Seq()

    val r = Utils.isWhitelistEmail(email, whitelistEmailTest)
    assertResult(true)(r)
  }

  test("Test email empty") {
    val email = ""
    val whitelistEmailTest = Seq("gmail.com", "meo.com")

    val r = Utils.isWhitelistEmail(email, whitelistEmailTest)
    assertResult(false)(r)
  }

  test("Test email empty with white list empty") {
    val email = ""
    val whitelistEmailTest = Seq()

    val r = Utils.isWhitelistEmail(email, whitelistEmailTest)
    assertResult(false)(r)
  }

  test("Test is not a email") {
    val email = "gmail.com"
    val whitelistEmailTest = Seq("gmail.com")

    val r = Utils.isWhitelistEmail(email, whitelistEmailTest)
    assertResult(false)(r)
  }

  test("Test is not a email empty with white list empty") {
    val email = "gmail.com"
    val whitelistEmailTest = Seq()

    val r = Utils.isWhitelistEmail(email, whitelistEmailTest)
    assertResult(false)(r)
  }

  test("Email domain is valid") {
    val domain = "gmail.com"
    val r = Utils.isValidEmailDomain(domain)
    assertResult(true)(r)
  }
}
