package datainsider.user_profile.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import datainsider.client.filter.DataRequestContext.MainRequestContextSyntax
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.login_provider.service.OrgOAuthorizationProvider
import datainsider.profiler.Profiler
import datainsider.user_profile.controller.http.filter.common.SessionFilter
import datainsider.user_profile.controller.http.filter.email.{EmailMustExistFilter, EmailShouldNotExistFilter}
import datainsider.user_profile.controller.http.filter.parser.OrganizationContext.OrganizationContextSyntax
import datainsider.user_profile.controller.http.filter.parser._
import datainsider.user_profile.controller.http.request._
import datainsider.user_profile.service.verification.VerifyService
import datainsider.user_profile.service.{AuthService, RegistrationService}

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author anhlt
  */
class AuthController @Inject() (
    registrationService: RegistrationService,
    authService: AuthService,
    emailVerifyService: VerifyService,
    orgOAuthProvider: OrgOAuthorizationProvider
) extends Controller
    with Logging {

  filter[RegisterRequestBodyParser]
    .filter[EmailShouldNotExistFilter]
    .post(s"/user/auth/register")((request: RegisterRequest) => {
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/user/auth/register") {
        val orgId: Long = request.request.orgId
        registrationService.register(orgId, request)
      }
    })

  filter[SendCodeToEmailParser]
    .filter[EmailMustExistFilter]
    .post(s"/user/auth/verify/send_code") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/user/auth/verify/send_code") {
        val orgId: Long = request.orgId
        val sendCodeRequest: SendCodeToEmailRequest = request.requestData
        emailVerifyService.resendVerifyCode(orgId, sendCodeRequest.email)
      }
    }

  filter[VerifyRegistrationRequestParser]
    .filter[EmailMustExistFilter]
    .post(s"/user/auth/verify") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/user/auth/verify") {
        val orgId: Long = request.orgId
        val verifyCodeRequest: VerifyRegistrationRequest = request.requestData
        registrationService.verifyCode(orgId, verifyCodeRequest.email, verifyCodeRequest.verifyCode)
      }
    }

  get(s"/user/auth/check_session") { request: CheckSessionRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::/user/auth/check_session") {
      authService.checkSession(request)
    }
  }

  filter[LoginRequestParser]
    .post(s"/user/auth/login") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/user/auth/login") {
        val orgId = request.orgId
        val loginInRequest = request.requestData[LoginByUserPassRequest]
        authService.login(orgId, loginInRequest.username, loginInRequest.password)
      }
    }

  filter[UserLoginOAuthParser]
    .post(s"/user/auth/login_oauth") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/user/auth/login_oauth") {
        val orgId: Long = request.orgId
        val loginOAuthReq = request.requestData[LoginOAuthRequest]
        authService.loginWithOAuth(orgId, loginOAuthReq)
      }
    }

  filter[SessionFilter]
    .post(s"/user/auth/logout") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/user/auth/logout") {
        authService.logout(request.currentSession.value)
      }
    }

  filter[ResetPasswordRequestParser]
    .filter[EmailMustExistFilter]
    .post(s"/user/auth/reset_password") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/user/auth/reset_password") {
        val orgId: Long = request.orgId
        val resetPasswordRequest: ResetPasswordRequest = request.requestData
        registrationService.resetPassword(
          orgId,
          resetPasswordRequest.email,
          resetPasswordRequest.newPassword,
          resetPasswordRequest.verifyCode
        )
      }
    }

  get(s"/user/auth/login_methods") { request: Request =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::/user/auth/login_methods") {
      val orgId: Long = request.orgId
      orgOAuthProvider.getOAuthConfigAsMap(orgId)
    }
  }

}
