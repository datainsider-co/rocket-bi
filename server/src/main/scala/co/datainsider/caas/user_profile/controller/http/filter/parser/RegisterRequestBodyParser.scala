package co.datainsider.caas.user_profile.controller.http.filter.parser

import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.login_provider.service.OrgOAuthorizationProvider
import co.datainsider.caas.user_caas.domain.UserGroup
import co.datainsider.caas.user_profile.controller.http.filter.DataRequestContext
import co.datainsider.caas.user_profile.controller.http.request.{RegisterRequest, RegisterUserRequestBody}
import co.datainsider.caas.user_profile.util.{JsonParser, Utils}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.common.client.exception.UnsupportedError

import javax.inject.{Inject, Named}

/**
  * @author sonpn
  */

case class RegisterRequestBodyParser @Inject() (
    orgOAuthorizationProvider: OrgOAuthorizationProvider,
    @Named("whitelist_email_regex_pattern") whitelistEmail: Seq[String]
) extends SimpleFilter[Request, Response]
    with Logging {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val bodyRequest = JsonParser.fromJson[RegisterUserRequestBody](request.contentString)
    Utils.isWhitelistEmail(bodyRequest.email, whitelistEmail) match {
      case true =>
        DataRequestContext.setDataRequest(request, toRegisterRequest(bodyRequest))
        service(request)
      case false => throw UnsupportedError(s"Unsupported your email domain: ${bodyRequest.email}")
    }
  }

  private def toRegisterRequest(bodyRequest: RegisterUserRequestBody): RegisterRequest = {
    val emailVerificationEnabled = ZConfig.getBoolean("verification.email.verification_enabled", true)
    RegisterRequest(
      bodyRequest.email,
      bodyRequest.password,
      bodyRequest.fullName,
      firstName = bodyRequest.firstName,
      lastName = bodyRequest.lastName,
      isVerifyEnabled = Some(emailVerificationEnabled),
      userGroup = UserGroup.withName(bodyRequest.userGroup.getOrElse("None"))
    )
  }
}
