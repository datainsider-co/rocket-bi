package co.datainsider.caas.login_provider.service

import co.datainsider.caas.admin.controller.http.request.DeleteOAuthRequest
import co.datainsider.caas.login_provider.domain.OAuthType
import co.datainsider.caas.user_caas.services.DataInsiderIntegrationTest
import co.datainsider.caas.user_profile.controller.http.filter.parser.MockUserContext
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import com.twitter.inject.Injector

class OAuthServiceTest extends DataInsiderIntegrationTest {
  // Todo: token illegal. Check again
//  test("Login oauth") {
//    val caasService = injector.instance[CaasService]
//    val fn = caasService.loginWithOAuth(0L, "gg", "107816399340789174403", "eyJhbGciOiJSUzI1NiIsImtpZCI6ImU4NzMyZGIwNjI4NzUxNTU1NjIxM2I4MGFjYmNmZDA4Y2ZiMzAyYTkiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJhY2NvdW50cy5nb29nbGUuY29tIiwiYXpwIjoiMTQ3MTIzNjMxNzYyLXAyMTQ5ZGVzb3NtcXI1OXVuN21iam0ycDY1azU2NmdoLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwiYXVkIjoiMTQ3MTIzNjMxNzYyLXAyMTQ5ZGVzb3NtcXI1OXVuN21iam0ycDY1azU2NmdoLmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwic3ViIjoiMTA3ODE2Mzk5MzQwNzg5MTc0NDAzIiwiZW1haWwiOiJtaW5odGh1YW45OTIyMkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IkdwSUFicWl6eGJOdk10czRtSl94WGciLCJuYW1lIjoiVGh14bqtbiBUcuG6p24gTWluaCIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS0vQU9oMTRHaWR1aVJBRnVqWVF2VzRVeUFicGRRYkhhV3ZIeW5HWEI1Rzd3ZnY9czk2LWMiLCJnaXZlbl9uYW1lIjoiVGh14bqtbiIsImZhbWlseV9uYW1lIjoiVHLhuqduIE1pbmgiLCJsb2NhbGUiOiJ2aSIsImlhdCI6MTYxNDg1NDg1NywiZXhwIjoxNjE0ODU4NDU3LCJqdGkiOiJlZWU4MzU4ZmVmM2Q5MjFlMDRhYzllMWEwNzVjZmY2ZTBiNjJlNTdmIn0.Xxg8FTbC2e0GzTAUmRk0lvY0lJxr6eWN7h8HNUGmv_kyn3rUHYZFRFZbA3cjICZczminyaVuDw8XmvRcdPYBNZlGJzrClzM1NQJxrHmgS1w1zLs5_taycK7_e8QwOO_xMk-fNhh9qoGZTuZNfPUmD5V9zce5O5CZ0r3YtYZQmoCX9kEa078FsXkb6lgAJcJ8w_2haO6joKFfrIxW-qDtOjIqJH5uYlRhsB5Cb7o3BIahCgjLWgGQPye6Zv8s6oEwuywJK627lchSViRC9swaZ26ExvHes-cc3R5rSfu5plysnXzAa5jsm8Gnq3tf6iZ5lVFWiOR5-LbQDT8hjK1H8w", None, None);
//    val r = await(fn)
//    println(r)
//  }


  val service: OrgOAuthorizationProvider = injector.instance[OrgOAuthorizationProvider]
  val baseRequest = MockUserContext.getLoggedInRequest(0, "root")

  test("delete oauth config"){
    val request = DeleteOAuthRequest(OAuthType.GOOGLE, baseRequest)
    val isDeleteOk = service.deleteOauthConfig(request.getOrganizationId(), request.id).syncGet()
    assert(isDeleteOk)
  }
}
