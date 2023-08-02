package co.datainsider.caas.user_profile.controller.http.filter.parser

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import co.datainsider.caas.user_profile.domain.user.UserProfile
import datainsider.client.exception.{EmailNotExistedError, RegistrationRequiredError, UnsupportedError}
import co.datainsider.caas.user_profile.controller.http.filter.DataRequestContext
import co.datainsider.caas.login_provider.domain.OAuthInfo
import co.datainsider.caas.login_provider.service.OrgOAuthorizationProvider
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.controller.http.request.UserOAuthRequestBody
import co.datainsider.caas.user_profile.domain.Implicits._
import co.datainsider.caas.user_profile.service.{OrganizationService, UserProfileService}
import co.datainsider.caas.user_profile.util.{Configs, JsonParser}

import javax.inject.Inject

/**
  * @author sonpn
  */

case class LoginOAuthRequest(oauthType: String, id: String, token: String, oauthInfo: OAuthInfo) {

  def email: String = oauthInfo.email

  def buildProfile(): UserProfile = {
    UserProfile(
      username = oauthInfo.username,
      fullName = oauthInfo.name,
      lastName = oauthInfo.familyName,
      firstName = oauthInfo.givenName,
      email = oauthInfo.email,
      avatar = oauthInfo.avatarUrl
    )
  }
}

class UserLoginOAuthParser @Inject() (
    profileService: UserProfileService,
    organizationService: OrganizationService,
    orgOAuthorizationProvider: OrgOAuthorizationProvider
) extends SimpleFilter[Request, Response] {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {

    val oAuthBodyRequest = JsonParser.fromJson[UserOAuthRequestBody](request.contentString)
    val orgDomain: String = request.getRequestDomain()

    for {
      // get oauth info
      // valid oauth data
      orgId <- organizationService.getByDomain(orgDomain).map(_.organizationId)
      oauthInfo <- orgOAuthorizationProvider.getOAuthInfo(
        orgId,
        oAuthBodyRequest.oauthType,
        oAuthBodyRequest.id,
        oAuthBodyRequest.token
      )
      _ <- verifyWhitelistEmailOnly(orgId, oAuthBodyRequest.oauthType, oauthInfo)
      oauthInfo <- Configs.isNeedVerifyPhone(oAuthBodyRequest.oauthType) match {
        case true =>
          profileService.getUserProfile(orgId, oauthInfo.username).map {
            case Some(profile) => oauthInfo
            case _             => throw RegistrationRequiredError()
          }
        case _ => Future.value(oauthInfo)
      }
      _ = DataRequestContext.setDataRequest(
        request,
        LoginOAuthRequest(oAuthBodyRequest.oauthType, oAuthBodyRequest.id, oAuthBodyRequest.token, oauthInfo)
      )
      resp <- service(request)
    } yield {
      resp
    }
  }

  private def verifyWhitelistEmailOnly(organizationId: Long, oauthType: String, oAuthInfo: OAuthInfo): Future[Unit] = {
    if (oAuthInfo.email != null && oAuthInfo.email.nonEmpty) {
      orgOAuthorizationProvider
        .isWhitelistEmail(organizationId, oauthType, oAuthInfo.email)
        .flatMap {
          case true => Future.unit
          case _    => Future.exception(UnsupportedError("Unsupported your email domain."))
        }
    } else {
      Future.exception(EmailNotExistedError("email is empty"))
    }
  }
}
