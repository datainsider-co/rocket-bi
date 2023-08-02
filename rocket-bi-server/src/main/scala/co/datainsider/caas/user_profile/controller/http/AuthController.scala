package co.datainsider.caas.user_profile.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.login_provider.service.OrgOAuthorizationProvider
import co.datainsider.caas.user_profile.controller.http.filter.DataRequestContext.MainRequestContextSyntax
import co.datainsider.caas.user_profile.controller.http.filter.common.SessionFilter
import co.datainsider.caas.user_profile.controller.http.filter.email.EmailMustExistFilter
import co.datainsider.caas.user_profile.controller.http.filter.parser.OrganizationContext.OrganizationContextSyntax
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.controller.http.filter.parser._
import co.datainsider.caas.user_profile.controller.http.request._
import co.datainsider.caas.user_profile.service.verification.VerifyService
import co.datainsider.caas.user_profile.service.{AuthService, RegistrationService}
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}

import javax.inject.Inject

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

  filter[SendCodeToEmailParser]
    .filter[EmailMustExistFilter]
    .post(s"/user/auth/forgot_password") { request: Request =>
      Profiler(s"/user/auth/forgot_password") {
        val orgId: Long = request.orgId
        val sendCodeRequest: SendCodeToEmailRequest = request.requestData
        emailVerifyService.sendForgotPasswordCode(orgId, sendCodeRequest.email)
      }
    }

  get(s"/user/auth/check_session") { request: CheckSessionRequest =>
    Profiler(s"/user/auth/check_session") {
      authService.checkSession(request)
    }
  }

  filter[LoginRequestParser]
    .post(s"/user/auth/login") { request: Request =>
      Profiler(s"/user/auth/login") {
        val orgId = request.orgId
        val loginInRequest = request.requestData[LoginByUserPassRequest]
        authService.login(orgId, loginInRequest.username, loginInRequest.password)
      }
    }

  filter[UserLoginOAuthParser]
    .post(s"/user/auth/login_oauth") { request: Request =>
      Profiler(s"/user/auth/login_oauth") {
        val orgId: Long = request.orgId
        val loginOAuthReq = request.requestData[LoginOAuthRequest]
        authService.loginWithOAuth(orgId, loginOAuthReq)
      }
    }

  filter[SessionFilter]
    .post(s"/user/auth/logout") { request: Request =>
      Profiler(s"/user/auth/logout") {
        authService.logout(request.currentSession.value)
      }
    }

  post("/user/auth/:code/status") { request: VerifyCodeRequest =>
    Profiler("/user/auth/:code/status") {
      emailVerifyService.verifyCode(request.email, request.code, delete = false).transform {
        case Return(_) => Future.value(Map("success" -> true))
        case Throw(e)  => Future.value(Map("success" -> false, "message" -> e.getMessage))
      }
    }
  }

  filter[ResetPasswordRequestParser]
    .filter[EmailMustExistFilter]
    .post(s"/user/auth/reset_password") { request: Request =>
      Profiler(s"/user/auth/reset_password") {
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
    Profiler(s"/user/auth/login_methods") {
      val orgId: Long = request.orgId
      orgOAuthProvider.getOAuthConfigAsMap(orgId)
    }
  }

}
