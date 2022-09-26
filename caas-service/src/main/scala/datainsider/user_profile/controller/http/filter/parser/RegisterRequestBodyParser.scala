package datainsider.user_profile.controller.http.filter.parser

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.UnsupportedError
import datainsider.client.filter.DataRequestContext
import datainsider.client.util.ZConfig
import datainsider.login_provider.service.OrgOAuthorizationProvider
import datainsider.profiler.Profiler
import datainsider.user_profile.controller.http.request.{RegisterRequest, RegisterUserRequestBody}
import datainsider.user_profile.util.{JsonParser, Utils}

import javax.inject.{Inject, Named}
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author sonpn
  */

case class RegisterRequestBodyParser @Inject() (
    orgOAuthorizationProvider: OrgOAuthorizationProvider,
    @Named("whitelist_email_regex_pattern") whitelistEmail: Seq[String]
) extends SimpleFilter[Request, Response]
    with Logging {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] =
    Profiler(s"[Filter] ${this.getClass.getSimpleName}::apply") {
      val bodyRequest = JsonParser.fromJson[RegisterUserRequestBody](request.contentString)
      Utils.isWhitelistEmail(bodyRequest.email, whitelistEmail) match {
        case true =>
          DataRequestContext.setDataRequest(request, toRegisterRequest(bodyRequest))
          service(request)
        case false => throw UnsupportedError(s"Unsupported your email domain: ${bodyRequest.email}")
      }
    }

  private def toRegisterRequest(bodyRequest: RegisterUserRequestBody): RegisterRequest =
    Profiler(s"[Filter] ${this.getClass.getSimpleName}::toRegisterRequest") {
      val emailVerificationEnabled = ZConfig.getBoolean("verification.email.verification_enabled", true)
      RegisterRequest(
        bodyRequest.email,
        bodyRequest.password,
        bodyRequest.fullName,
        firstName = bodyRequest.firstName,
        lastName = bodyRequest.lastName,
        isVerifyEnabled = Some(emailVerificationEnabled)
      )
    }
}
