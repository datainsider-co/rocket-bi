package co.datainsider.caas.user_profile.service

import co.datainsider.bi.util.Implicits._
import co.datainsider.caas.user_caas.domain.SessionConfig
import co.datainsider.caas.user_caas.service.CaasService
import co.datainsider.caas.user_profile.controller.http.filter.parser.LoginOAuthRequest
import co.datainsider.caas.user_profile.controller.http.request.CheckSessionRequest
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.domain.user.{LoginResponse, LoginResult, SessionInfo, UserProfile}
import co.datainsider.common.client.exception.{BadRequestError, UnAuthorizedError}
import com.twitter.inject.Logging
import com.twitter.util.Future

import javax.inject.Inject

/**
  * @author sonpn
  *  @contribute andy
  */
trait AuthService {
  def checkSession(ssId: String): Future[LoginResponse]

  def checkSession(request: CheckSessionRequest): Future[LoginResponse]

  def loginWithOAuth(orgId: Long, request: LoginOAuthRequest): Future[LoginResponse]

  def login(orgId: Long, username: String, password: String): Future[LoginResponse]

  def logout(ssId: String): Future[SessionInfo]

  def delete(orgId: Long, username: String): Future[Boolean]
}

case class AuthServiceImpl @Inject() (
    sessionConfig: SessionConfig,
    caasService: CaasService,
    registrationService: RegistrationService,
    profileService: UserProfileService,
    organizationService: OrganizationService
) extends AuthService
    with Logging {

  override def checkSession(request: CheckSessionRequest): Future[LoginResponse] = {
    val response = LoginResponse(
      request.currentSession,
      request.currentUser,
      request.currentProfile
    )

    Future.value(response)
  }

  override def checkSession(ssId: String): Future[LoginResponse] = {
    for {
      loginResult <- caasService.loginBySessionId(ssId)
      organizationId = loginResult.getOrganizationId() match {
        case Some(value) => value
        case None        => throw UnAuthorizedError("Not found organization id")
      }
      userProfile <-
        profileService
          .getUserProfile(organizationId, loginResult.user.username)
          .notNullOrEmpty("this profile is not found.")
      loginResponse <- toLoginResponse(loginResult, userProfile)
    } yield loginResponse

  }

  override def login(orgId: Long, username: String, password: String): Future[LoginResponse] = {
    for {
      userProfile <- profileService.getVerifiedUserProfile(orgId, username)
      loginResult <- caasService.loginToOrg(orgId, username, password, Option(sessionConfig.expiredTimeInMs))
      loginResponse <- toLoginResponse(loginResult, userProfile)
    } yield loginResponse
  }

  override def loginWithOAuth(orgId: Long, request: LoginOAuthRequest): Future[LoginResponse] = {
    def getExistingProfileOrRegister(request: LoginOAuthRequest): Future[UserProfile] = {
      profileService.findProfileByEmail(orgId, request.email).flatMap {
        case Some(profile) => Future.value(profile)
        case _             => registrationService.registerOAuth(orgId, request.oauthInfo).map(_.userProfile)
      }
    }

    for {
      userProfile <- getExistingProfileOrRegister(request)
      loginResult <- caasService.loginOAuth(orgId, userProfile.username, Option(sessionConfig.expiredTimeInMs))
      loginResponse <- toLoginResponse(loginResult, userProfile)
    } yield loginResponse
  }

  private def getOrganizationFromLoginResult(loginResult: LoginResult): Future[Option[Organization]] = {

    loginResult.getOrganization() match {
      case Some(org) => Future.value(Some(org))
      case _         => loginResult.getOrganizationId().map(organizationService.getOrganization(_)).getOrElse(Future.None)
    }
  }

  private def toLoginResponse(loginResult: LoginResult, profile: UserProfile): Future[LoginResponse] = {
    getOrganizationFromLoginResult(loginResult).flatMap {
      case Some(org) => buildLoginResponse(loginResult, profile, loginResult.getOrganization().getOrElse(org))
      case None      => throw BadRequestError("unable to find valid org with current login info")
    }
  }

  private def buildLoginResponse(
      loginResult: LoginResult,
      profile: UserProfile,
      organization: Organization
  ): Future[LoginResponse] = {
    val response = LoginResponse(
      loginResult.session,
      loginResult.buildUserInfo(organization),
      Some(profile)
    )
    Future.value(response)
  }

  override def logout(ssId: String): Future[SessionInfo] = {
    caasService.logout(ssId).map { _ =>
      SessionInfo(sessionConfig.key, ssId, sessionConfig.domain, -1, None)
    }
  }

  override def delete(orgId: Long, username: String): Future[Boolean] = {
    caasService
      .deleteUser(orgId, username)
      .flatMap { _ =>
        profileService.deleteUserProfile(orgId, username)
      }
  }
}
