package datainsider.user_caas.controller

import datainsider.client.util.ZConfig
import datainsider.login_provider.domain.{FbOAuthConfig, GoogleOAuthConfig}
import datainsider.login_provider.repository.{FacebookOAuthProvider, GoogleOAuthProvider}
import datainsider.user_profile.util.JsonParser
import org.apache.commons.codec.digest.HmacUtils

/**
 * @author sonpn
 */
object GoogleOAuthTest {
  val googleAppId = Set("147123631762-p2149desosmqr59un7mbjm2p65k566gh.apps.googleusercontent.com")
  val fbAppSecret = ZConfig.getString("db.oauth.facebook.app_secret", null)

  def main(args: Array[String]): Unit = {
    val id = "107734860083378891300"
    val token = "eyJhbGciOiJSUzI1NiIsImtpZCI6ImJjNDk1MzBlMWZmOTA4M2RkNWVlYWEwNmJlMmNlNDM3ZjQ5YzkwNWUiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMTQ3MTIzNjMxNzYyLXAyMTQ5ZGVzb3NtcXI1OXVuN21iam0ycDY1azU2NmdoLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTQ3MTIzNjMxNzYyLXAyMTQ5ZGVzb3NtcXI1OXVuN21iam0ycDY1azU2NmdoLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA3NzM0ODYwMDgzMzc4ODkxMzAwIiwiaGQiOiJnbS51aXQuZWR1LnZuIiwiZW1haWwiOiIxNzUyMTA4MEBnbS51aXQuZWR1LnZuIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJ0V2NHSVZQSzN3dXNSeFgxNG1JQm1nIiwibmFtZSI6IlRoaWVuIFRyYW4gZGluaCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS0vQU9oMTRHanlKRm90bzJsR0pYanY0UlN2ZFBYSFU1c1pHZU5XaHd0WUIwaWI9czk2LWMiLCJnaXZlbl9uYW1lIjoiVGhpZW4iLCJmYW1pbHlfbmFtZSI6IlRyYW4gZGluaCIsImxvY2FsZSI6InZpIiwiaWF0IjoxNTk5MTE5OTkxLCJleHAiOjE1OTkxMjM1OTEsImp0aSI6ImExNmZiYWJhNzE5NjBlZWU2Y2JhZGZhNTYyNTAxNjRjZjkzMTEzZjkifQ.lI8RBe8BhjCJdeCjmKa1MvlAIZuPXZ-74Ss0PwFFcCEX2T115TqkBoeDAV-MfYyVk1_MVtC3uHWA8BbNzPdU1SqF0QcjBdPaEH67zjlrDscgjBgqqttCg067EEUlGRkBIlBLMY7eTfhh_lm7rpqhIBfnQWIVskfyTMo6DcWTIqSv2dMTQUWM1b_5GRghiN2OMVr-14pHHbGjBJNpjbtaZGjMbmuxjWV8coCaIGwn_1KHhpfzp7kk3IFCvMuGHjNRzJNVhzMfSc-e2Qxqv4pnt4KuU31fnRbEFfJ_SoGlw48rrN8YISzNTAwlEXrpucYyrVJKoMw2U2t7AGeQoXxwEw"
    val obj = GoogleOAuthProvider(GoogleOAuthConfig(true, whitelistEmail = Seq.empty, clientIds = Set(token))).getOAuthInfo(id, token)
    println(JsonParser.toJson(obj))
  }
}

object GoogleOAuthFailedTest {
  val googleAppId = Set("147123631762-p2149desosmqr59un7mbjm2p65k566gh.apps.googleusercontent.com")
  val fbAppSecret = ZConfig.getString("db.oauth.facebook.app_secret", null)

  def main(args: Array[String]): Unit = {
    val id = "112433301274568705376"
    val token =
      "eyJhbGciOiJSUzI1NiIsImtpZCI6ImI4M2M0ZTU5YTllMWZiODA5ZTM4ZjkwMmFhMWE4YzVkZjY1ZTk1MmEifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiaWF0IjoxNDg2NDMyNDUyLCJleHAiOjE0ODY0MzYwNTIsImF0X2hhc2giOiJ2M2ZFblA3YXhKUDFzdDJUUHlBeHlnIiwiYXVkIjoiNzkzNzg4Mzc4MTY1LTl0NDIzbWFkNjliMzExZ2htdXN0aGVzbnVjYTNhZ3JyLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTEyNDMzMzAxMjc0NTY4NzA1Mzc2IiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF6cCI6Ijc5Mzc4ODM3ODE2NS05dDQyM21hZDY5YjMxMWdobXVzdGhlc251Y2EzYWdyci5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsImhkIjoicmV2ZXIudm4iLCJlbWFpbCI6InNvbnBuQHJldmVyLnZuIiwibmFtZSI6IlPGoW4gUGjhuqFtIE5n4buNYyIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vLUpaQW5BZVR2ek9zL0FBQUFBQUFBQUFJL0FBQUFBQUFBQURBL2tqNXJIRm5fV2tNL3M5Ni1jL3Bob3RvLmpwZyIsImdpdmVuX25hbWUiOiJTxqFuIiwiZmFtaWx5X25hbWUiOiJQaOG6oW0gTmfhu41jIiwibG9jYWxlIjoiZW4ifQ.pGGnZyPXam9pjzW0CahUuUu3UMKzDtKtDrVsh7cA44qGtCj8FNOdKUsxQmqkCmXX9iy5OELHK6xPW38wQ4dVptLZnQxLwreN9Or_EdwPBauCxwz6uCQ7USZUSY7INdkO837j-tyRnoGrSVSiH_pXYkyTcqjQs_lnyp1ajKD-rKxuC6xhT3OjusWdeC9vlU5tsCBBEGC0FPO5a_iWnFEo7tsOl-3wnbWMGTrNN7uEZy0XnJgAl1zwoDlWQr8jboERqaRkaNPiPosxsWYcdkJ7uo9WaLemqlMD9EXos65dKVtG_0V3dDfQQN7qc2c-F3nY4viJDcF0XcfqtM-tpBdz7w"
    val obj = GoogleOAuthProvider(GoogleOAuthConfig(true, whitelistEmail = Seq.empty, clientIds = googleAppId)).getOAuthInfo(id, token)
    println(JsonParser.toJson(obj))
  }
}

object FacebookOAuthTest {
  val googleAppId = ZConfig.getString("db.oauth.google.app_id", null)
  val fbAppSecret = ZConfig.getString("db.oauth.facebook.app_secret", null)

  def main(args: Array[String]): Unit = {
    val id = "1226173844117726"
    val token =
      "EAAIwm1qe1OsBAAy7LYTaYWR2XGnBWZC53luEXbq1rDo1Rc0qbsHG6gxzGZC1P5qZCVTYAE0YGbX7eG7YUCBBh3CX0tD9zaMTcZB6LwAZAnwlfhpvJusSJ120LxudDjZAptupFjmwK2x4co0sbZBoK5qzY6s1Y4r1hRVFZBjkXFcfhuDPDiUB5ZAJ7Mb1B3PUKR8gZD"
    val obj = FacebookOAuthProvider(FbOAuthConfig(false, Seq.empty, fbAppSecret)).getOAuthInfo(id, token)
    println(JsonParser.toJson(obj))
  }
}

object FacebookOAuthFailedTest {
  val googleAppId = ZConfig.getString("db.oauth.google.app_id", null)
  val fbAppSecret = ZConfig.getString("db.oauth.facebook.app_secret", null)

  def main(args: Array[String]): Unit = {
    val id = "1218235844911526"
    val token =
      "EAAQZBZCin8ZBkQBADuoMwe9aZBU3AantLxCrVVow3k8l1C9nOHlVKbciQJFREWy9ZAr6ynqSH8qNJouFq4Qb3k7mW3AW537qPav3NhP7ZArRvjtrcc3kINqan53iQvtwd3EFuTcd9lZC3nHxwORxDdxYETh6hDuTj4ZCZCziOTd6Vzn4R3YJr8rRfPhujkApg4V0ZD"
    val obj = new FacebookOAuthProvider(FbOAuthConfig(false, Seq.empty, fbAppSecret)).getOAuthInfo(id, token)
    println(JsonParser.toJson(obj))
  }
}

object FacebookOAuthFailed2Test {
  val googleAppId = ZConfig.getString("db.oauth.google.app_id", null)
  val fbAppSecret = ZConfig.getString("db.oauth.facebook.app_secret", null)

  def main(args: Array[String]): Unit = {
    val id = "1226173844117726"
    val token =
      "EAAQZBZCin8ZBkQBADuoMwe9aZBU3AantLxCrVVow3k8l1C9nOHlVKbciQJFREWy9ZAr6ynqSH8qNJouFq4Qb3k7mW3AW537qPav3NhP7ZArRvjtrcc3kINqan53iQvtwd3EFuTcd9lZC3nHxwORxDdxYETh6hDuTj4ZCZCziOTd6Vzn4R3YJr8rRfPhujkApg4V0ZD"
    val obj = new FacebookOAuthProvider(FbOAuthConfig(false, Seq.empty, fbAppSecret)).getOAuthInfo(id, token)
    println(JsonParser.toJson(obj))
  }
}

object FacebookOtherTest {
  val googleAppId = ZConfig.getString("db.oauth.google.app_id", null)
  val fbAppSecret = ZConfig.getString("db.oauth.facebook.app_secret", null)

  def main(args: Array[String]): Unit = {
    val appSecretProof = HmacUtils.hmacSha256Hex(
      "5d175238643677c3d7c1218ab3b85647",
      "EAAYfX1rmlLgBALRoZBAm422sYTSxz790jCE47kKZAuSaILc5uo8DSC3mL977ZAn02nlHF97ZBjRoe9CZBfgCChYUFwdvlvzy0mXkZC1m5wf0NICTeFr5fAZAc26cpNrTCBCAocSfNC5YgQ1BxNZCBLX12qRjcXDFxUSmmoSZAfgSmcQZDZD"
    )
    println(appSecretProof)
  }
}
