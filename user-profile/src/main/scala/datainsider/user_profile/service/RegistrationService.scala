package datainsider.user_profile.service

import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import datainsider.client.domain.ThriftImplicit.RichUser
import datainsider.client.domain.org.Organization
import datainsider.client.domain.user.{LoginResponse, LoginResult, User, UserProfile}
import datainsider.client.util.{ByKeyAsyncMutex, ZConfig}
import datainsider.login_provider.domain.OAuthInfo
import datainsider.login_provider.service.OrgOAuthorizationProvider
import datainsider.profiler.Profiler
import datainsider.user_caas.domain.PasswordMode.PasswordMode
import datainsider.user_caas.domain.SessionConfig
import datainsider.user_caas.service.{CaasService, UserService}
import datainsider.user_profile.controller.http.request.{EditProfileRequest, RegisterRequest}
import datainsider.user_profile.domain.Implicits._
import datainsider.user_profile.domain.profile._
import datainsider.user_profile.service.verification.{ChannelService, EmailFactory, VerifyService}
import datainsider.user_profile.util.{JsonParser, Utils}

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

trait RegistrationService {
  def register(orgId: Long, request: RegisterRequest): Future[RegisterResponse]

  def registerOAuth(orgId: Long, oauthInfo: OAuthInfo): Future[RegisterResponse]

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
    emailChannel: ChannelService
) extends RegistrationService
    with Logging {

  private[this] def mutex = ByKeyAsyncMutex()

  override def register(orgId: Long, request: RegisterRequest): Future[RegisterResponse] =
    Profiler(s"[UserProfile] RegistrationServiceImpl::register") {
      def doRegister(orgId: Long, request: RegisterRequest): Future[RegisterResponse] = {
        for {
          (user, userProfile) <- createUserProfileInfo(
            orgId,
            request.buildUserProfile(),
            request.password,
            request.passwordMode
          )
          _ <- sendVerifyCode(request.email, userProfile)
        } yield RegisterResponse(user.toUserInfo, userProfile)
      }

      mutex.acquireAndRun(request.email) {
        doRegister(orgId, request)
      }
    }

  override def registerOAuth(orgId: Long, oauthInfo: OAuthInfo): Future[RegisterResponse] =
    Profiler(s"[UserProfile] ${this.getClass.getSimpleName}::registerOAuth") {
      def doRegisterOAuth(oauthInfo: OAuthInfo): Future[RegisterResponse] = {
        for {
          (user, userProfile) <-
            createUserProfileInfo(orgId, oauthInfo.toUserProfile, orgOAuthorizationProvider.generatePassword())
          _ <- sendVerifyCode(oauthInfo.email, userProfile)
        } yield RegisterResponse(user.toUserInfo(), userProfile)
      }

      mutex.acquireAndRun(oauthInfo.email) {
        doRegisterOAuth(oauthInfo)
      }
    }

  private def sendVerifyCode(email: String, userProfile: UserProfile): Future[Boolean] =
    Profiler(s"[UserProfile] ${this.getClass.getSimpleName}::sendVerifyCode") {
      userProfile.alreadyConfirmed match {
        case true => Future.True
        case _    => verifyService.sendVerifyCode(email, userProfile)
      }
    }

  private def createUserProfileInfo(
      organizationId: Long,
      userProfile: UserProfile,
      password: String,
      passwordMode: Option[PasswordMode] = None
  ): Future[(User, UserProfile)] =
    Profiler(s"[UserProfile] ${this.getClass.getSimpleName}::createUserProfileInfo") {
      val fn = for {
        credentialInfo <- userService.createUser(organizationId, userProfile.username, password, passwordMode)
        userProfile <- profileService.createProfile(organizationId, userProfile)
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
  private def rollbackOnProfileCreationFailure(organizationId: Long, username: String): Future[Unit] =
    Profiler(s"[UserProfile] ${this.getClass.getSimpleName}::rollbackOnProfileCreationFailure") {
      for {
        _ <- caasService.deleteUser(organizationId, username)
        _ <- profileService.deleteUserProfile(organizationId, username)
      } yield {}
    }

  private def buildLoginResponse(loginResult: LoginResult, userProfile: UserProfile): Future[LoginResponse] =
    Profiler(s"[UserProfile] ${this.getClass.getSimpleName}::buildLoginResponse") {
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

  override def verifyLink(orgId: Long, token: String): Future[LoginResponse] =
    Profiler(s"[UserProfile] ${this.getClass.getSimpleName}::verifyLink") {
      val decryptedToken = Utils.decrypt(token)
      val x = JsonParser.fromJson[VerifyCodeInfo](decryptedToken)
      verifyCode(orgId, x.email, x.code)
    }

  override def verifyCode(orgId: Long, email: String, verifyCode: String): Future[LoginResponse] =
    Profiler(s"[UserProfile] ${this.getClass.getSimpleName}::verifyCode") {
      for {
        _ <- verifyService.verifyCode(email, verifyCode, delete = true)
        userProfile <- profileService.getUserProfileByEmail(orgId, email)
        loginResult <- caasService.loginOAuth(orgId, userProfile.username, sessionConfig.expiredTimeInMs)
        loginResponse <- setProfileAsConfirmed(orgId, userProfile.username).flatMap(buildLoginResponse(loginResult, _))
      } yield loginResponse
    }

  private def setProfileAsConfirmed(organizationId: Long, username: String): Future[UserProfile] =
    Profiler(s"[UserProfile] ${this.getClass.getSimpleName}::setProfileAsConfirmed") {
      profileService.updateProfile(organizationId, username, EditProfileRequest(alreadyConfirmed = Some(true)))
    }

  override def resetPassword(orgId: Long, email: String, newPassword: String, verifyCode: String): Future[Boolean] =
    Profiler(s"[UserProfile] ${this.getClass.getSimpleName}::resetPassword") {
      for {
        username <-
          profileService
            .getUserProfileByEmail(orgId, email)
            .map(_.username)
        _ <- verifyService.verifyCode(email, verifyCode, delete = true)
        _ <- caasService.resetUserPassword(orgId, username, newPassword)
      } yield {
        true
      }
    }

}
