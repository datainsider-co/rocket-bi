package co.datainsider.caas.user_profile.service

import co.datainsider.caas.login_provider.domain.OAuthInfo
import co.datainsider.caas.login_provider.service.OrgOAuthorizationProvider
import co.datainsider.caas.user_caas.domain.PasswordMode.PasswordMode
import co.datainsider.caas.user_caas.domain.UserGroup.UserGroup
import co.datainsider.caas.user_caas.domain.{SessionConfig, UserGroup}
import co.datainsider.caas.user_caas.service.{CaasService, OrgAuthorizationService, UserService}
import co.datainsider.caas.user_profile.controller.http.request.{EditProfileRequest, RegisterRequest}
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.domain.profile.{RegisterResponse, VerifyCodeInfo}
import co.datainsider.caas.user_profile.domain.user.{LoginResponse, LoginResult, User, UserProfile}
import co.datainsider.caas.user_profile.service.verification.{ChannelService, EmailFactory, VerifyService}
import co.datainsider.caas.user_profile.util.{JsonParser, Utils}
import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import datainsider.client.util.ByKeyAsyncMutex

import javax.inject.Inject

trait RegistrationService {
  @deprecated("unused code, cause unsupported manual register use register in admin controller instead")
  def register(orgId: Long, request: RegisterRequest): Future[RegisterResponse]

  def registerOAuth(orgId: Long, oauthInfo: OAuthInfo): Future[RegisterResponse]

  @deprecated("unused code, cause change flow forgot password")
  def verifyLink(orgId: Long, token: String): Future[LoginResponse]

  def verifyCode(orgId: Long, email: String, verifyCode: String): Future[LoginResponse]

  def resetPassword(orgId: Long, email: String, newPassword: String, verifyCode: String): Future[Boolean]
}

case class RegistrationServiceImpl @Inject() (
    sessionConfig: SessionConfig,
    verifyService: VerifyService,
    caasService: CaasService,
    orgOAuthorizationProvider: OrgOAuthorizationProvider,
    userService: UserService,
    profileService: UserProfileService,
    organizationService: OrganizationService,
    emailFactory: EmailFactory,
    emailChannel: ChannelService,
    orgAuthorizationService: OrgAuthorizationService
) extends RegistrationService
    with Logging {

  private[this] def mutex = ByKeyAsyncMutex()

  override def register(orgId: Long, request: RegisterRequest): Future[RegisterResponse] = {
    def doRegister(orgId: Long, request: RegisterRequest): Future[RegisterResponse] = {
      for {
        (user, userProfile) <- createUserProfileInfo(
          organizationId = orgId,
          userProfile = request.buildUserProfile(),
          password = request.password,
          passwordMode = request.passwordMode,
          userGroup = request.userGroup
        )
        _ <- sendVerifyCode(request.email, userProfile)
      } yield RegisterResponse(user.toUserInfo, userProfile)
    }

    mutex.acquireAndRun(request.email) {
      doRegister(orgId, request)
    }
  }

  override def registerOAuth(orgId: Long, oauthInfo: OAuthInfo): Future[RegisterResponse] = {
    def doRegisterOAuth(oauthInfo: OAuthInfo): Future[RegisterResponse] = {
      for {
        (user, userProfile) <- createUserProfileInfo(
          organizationId = orgId,
          userProfile = oauthInfo.toUserProfile,
          password = orgOAuthorizationProvider.generatePassword(),
          userGroup = UserGroup.Editor
        )
        _ <- sendVerifyCode(oauthInfo.email, userProfile)
      } yield RegisterResponse(user.toUserInfo(), userProfile)
    }

    mutex.acquireAndRun(oauthInfo.email) {
      doRegisterOAuth(oauthInfo)
    }
  }

  private def sendVerifyCode(email: String, userProfile: UserProfile): Future[Boolean] = {
    userProfile.alreadyConfirmed match {
      case true => Future.True
      case _    => verifyService.sendVerifyCode(email, userProfile)
    }
  }

  private def createUserProfileInfo(
      organizationId: Long,
      userProfile: UserProfile,
      password: String,
      passwordMode: Option[PasswordMode] = None,
      userGroup: UserGroup
  ): Future[(User, UserProfile)] = {
    val fn = for {
      _ <- orgAuthorizationService.checkGroupAvailability(organizationId, userGroup)
      credentialInfo <- userService.createUser(organizationId, userProfile.username, password, passwordMode)
      userProfile <- profileService.createProfile(organizationId, userProfile)
      _ <- assignToGroup(organizationId, userProfile.username, userGroup)
    } yield (credentialInfo, userProfile)

    fn.transform {
      case Return(r) => Future.value(r)
      case Throw(e) =>
        rollbackOnProfileCreationFailure(organizationId, userProfile.username).flatMap(_ => Future.exception(e))
    }
  }

  /**
    * TODO: Publish register profile failure into a distributed message queue ( such as Kafka )
    * Clear all related data
    *
    * @param username
    * @return
    */
  private def rollbackOnProfileCreationFailure(organizationId: Long, username: String): Future[Unit] = {
    for {
      _ <- caasService.deleteUser(organizationId, username)
      _ <- profileService.deleteUserProfile(organizationId, username)
    } yield {}
  }

  private def buildLoginResponse(loginResult: LoginResult, userProfile: UserProfile): Future[LoginResponse] = {
    for {
      organization <- loginResult.getOrganization() match {
        case Some(org) => Future.value(Some(org))
        case _ =>
          loginResult
            .getOrganizationId()
            .fold[Future[Option[Organization]]](Future.None)(organizationService.getOrganization(_))
      }
    } yield {
      LoginResponse(
        loginResult.session,
        loginResult.user
          .toUserInfo()
          .copy(
            organization = organization
          ),
        Some(userProfile)
      )
    }

  }

  override def verifyLink(orgId: Long, token: String): Future[LoginResponse] = {
    val decryptedToken = Utils.decrypt(token)
    val x = JsonParser.fromJson[VerifyCodeInfo](decryptedToken)
    verifyCode(orgId, x.email, x.code)
  }

  override def verifyCode(orgId: Long, email: String, verifyCode: String): Future[LoginResponse] = {
    for {
      _ <- verifyService.verifyCode(email, verifyCode, delete = true)
      userProfile <- profileService.getUserProfileByEmail(orgId, email)
      loginResult <- caasService.loginOAuth(orgId, userProfile.username, Some(sessionConfig.expiredTimeInMs))
      loginResponse <- setProfileAsConfirmed(orgId, userProfile.username).flatMap(buildLoginResponse(loginResult, _))
    } yield loginResponse
  }

  private def setProfileAsConfirmed(organizationId: Long, username: String): Future[UserProfile] = {
    profileService.updateProfile(organizationId, username, EditProfileRequest(alreadyConfirmed = Some(true)))
  }

  override def resetPassword(orgId: Long, email: String, newPassword: String, verifyCode: String): Future[Boolean] = {
    for {
      username <-
        profileService
          .getUserProfileByEmail(orgId, email)
          .map(_.username)
      _ <- verifyService.verifyCode(email, verifyCode, delete = true)
      _ <- caasService.setUserPassword(orgId, username, newPassword)
    } yield {
      true
    }
  }

  private def assignToGroup(
      organizationId: Long,
      username: String,
      userGroup: UserGroup
  ): Future[Boolean] = {
    orgAuthorizationService
      .assignToGroup(organizationId, username, userGroup)
      .rescue {
        case e: Throwable =>
          logger.error(
            s"assignToGroup failed for org: $organizationId, user: $username, group: ${userGroup.toString}, exception: ${e.getMessage}",
            e
          )
          Future.False
      }
  }

}
