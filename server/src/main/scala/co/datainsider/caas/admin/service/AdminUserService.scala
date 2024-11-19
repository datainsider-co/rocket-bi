package co.datainsider.caas.admin.service

import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.admin.module.ConfigureAccount
import co.datainsider.caas.user_caas.domain.UserType.UserType
import co.datainsider.caas.user_caas.domain.{Page, PasswordMode, UserGroup}
import co.datainsider.caas.user_caas.service.{CaasService, UserService}
import co.datainsider.caas.user_profile.controller.http.request.EditProfileRequest
import co.datainsider.caas.user_profile.domain.profile.UserFullDetailInfo
import co.datainsider.caas.user_profile.domain.user.{User, UserProfile}
import co.datainsider.caas.user_profile.service.{RegistrationService, UserProfileService}
import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import co.datainsider.common.authorization.domain.PermissionByUserProviders
import co.datainsider.common.client.exception.{InternalError, NotFoundError}

import javax.inject.Inject

/**
  * @author andy
  */
trait AdminUserService {

  def createAdminAccount(organizationId: Long, account: ConfigureAccount): Future[String]

  def assignAdminPermissions(organizationId: Long, username: String): Future[Boolean]

  def getUserFullDetail(organizationId: Long, username: String): Future[UserFullDetailInfo]

  /**
    * Edit thong tin profile, nhung khong edit duoc thong tin properties cua user, su dung updateUserProperties cho viec update properties
    */
  def updateProfile(organizationId: Long, username: String, request: EditProfileRequest): Future[UserProfile]

  /**
    * Update properties cua user
    */
  @throws[NotFoundError]("if user not found")
  def updateUserProperties(
      organizationId: Long,
      username: String,
      properties: Map[String, String],
      deletedPropertyKeys: Set[String]
  ): Future[UserProfile]

  def activate(organizationId: Long, username: String): Future[Boolean]

  def deactivate(organizationId: Long, username: String): Future[Boolean]

  @deprecated(message = "Use searchUsersV2 instead")
  def searchUsers(organizationId: Long, isActive: Option[Boolean], from: Int, size: Int): Future[Page[UserProfile]]

  def searchUsersV2(
      organizationId: Long,
      keyword: String,
      from: Int,
      size: Int,
      userType: Option[UserType]
  ): Future[Page[UserFullDetailInfo]]

  def delete(organizationId: Long, username: String, transferToEmail: Option[String]): Future[Boolean]

  /**
    * admin reset password of user. New password is hard coded
    */
  def resetPassword(organizationId: Long, username: String): Future[Boolean]
}

case class AdminUserServiceImpl @Inject() (
    registrationService: RegistrationService,
    caasService: CaasService,
    userService: UserService,
    profileService: UserProfileService
) extends AdminUserService
    with Logging {

  private val DEFAULT_PASSWORD = ZConfig.getString("default_password", "di@123456")

  override def createAdminAccount(organizationId: Long, account: ConfigureAccount): Future[String] = {
    registerAccount(organizationId, account.copy(userGroup = UserGroup.Editor))
  }

  private def registerAccount(organizationId: Long, account: ConfigureAccount): Future[String] = {
    profileService.getUserProfileByEmail(organizationId, account.email).transform {
      case Return(profile) =>
        val userId: String = profile.username
        userService
          .setPassword(
            organizationId,
            userId,
            account.password.get,
            account.passwordMode
          )
          .map(_ => userId)
      case Throw(e) => registrationService.register(organizationId, account.toRegisterRequest).map(_.userInfo.username)
    }
  }

  override def assignAdminPermissions(orgId: Long, username: String): Future[Boolean] = {
    caasService
      .orgAuthorization()
      .addPermissions(
        orgId,
        username,
        PermissionByUserProviders.adminUser.allPermissions(orgId).toSeq
      )
  }

  override def getUserFullDetail(organizationId: Long, username: String): Future[UserFullDetailInfo] = {
    for {
      user <- getUserInfoAndPermissions(organizationId, username)
      profile <- profileService.getUserProfile(organizationId, username)
      userGroup <- caasService.orgAuthorization().getUserGroup(organizationId, username)
    } yield UserFullDetailInfo(user.toUserInfo, profile, Some(userGroup))
  }

  private def getUserInfoAndPermissions(organizationId: Long, username: String): Future[User] = {
    for {
      user <- userService.getUserInfo(organizationId, username)
      permissions <- caasService.orgAuthorization().getAllPermissions(organizationId, username)
    } yield user.copy(permissions = permissions.toSet)
  }

  override def updateProfile(
      organizationId: Long,
      username: String,
      request: EditProfileRequest
  ): Future[UserProfile] = {
    profileService.updateProfile(organizationId, username, request)
  }

  @deprecated(message = "Use searchUsersV2 instead")
  override def searchUsers(
      organizationId: Long,
      isActive: Option[Boolean],
      from: Int,
      size: Int
  ): Future[Page[UserProfile]] = {
    profileService.searchUsers(organizationId, isActive, from, size)
  }

  override def searchUsersV2(
      organizationId: Long,
      keyword: String,
      from: Int,
      size: Int,
      userType: Option[UserType]
  ): Future[Page[UserFullDetailInfo]] = {
    for {
      userProfiles <- profileService.searchUsers(organizationId, keyword, userType, Some(from), Some(size))
      userProfileAsMap = userProfiles.data.map(profile => profile.username -> profile).toMap
      users <- userService.getListUserByUsernames(organizationId, userProfileAsMap.keySet.toSeq)
    } yield {
      buildFullUserDetailResult(Page(userProfiles.total, users), userProfileAsMap)
    }
  }

  private def buildFullUserDetailResult(
      users: Page[User],
      profileMap: Map[String, UserProfile]
  ): Page[UserFullDetailInfo] = {
    val userFullDetailInfos = users.data.map { user =>
      val profile = profileMap.get(user.username)
      UserFullDetailInfo(user.toUserInfo(), profile)
    }

    Page[UserFullDetailInfo](users.total, userFullDetailInfos)
  }

  override def activate(organizationId: Long, username: String): Future[Boolean] = {
    userService.changeUserActiveStatus(organizationId, username, true)
  }

  override def deactivate(organizationId: Long, username: String): Future[Boolean] = {
    userService.changeUserActiveStatus(organizationId, username, false)
  }

  /**
    * TODO: Improve here by using Saga pattern.
    * @param request
    * @return
    */
  override def delete(organizationId: Long, username: String, transferToEmail: Option[String]): Future[Boolean] = {
    for {
      _ <- transferToEmail match {
        case Some(email) => transferRoleAndPermissions(organizationId, username, email)
        case None        => Future.Unit
      }
      _ <- userService.deleteUser(organizationId, username)
    } yield true
  }

  private def transferRoleAndPermissions(
      organizationId: Long,
      fromUser: String,
      toEmail: String
  ): Future[Unit] = {
    for {
      targetUsername <- profileService.getUserProfileByEmail(organizationId, toEmail).map(_.username)
      transferRoleOK <- userService.transferRoles(organizationId, fromUser, targetUsername)
      transferPermissionOK <- userService.transferPermissions(organizationId, fromUser, targetUsername)
    } yield transferRoleOK && transferPermissionOK match {
      case true  => Unit
      case false => throw InternalError("Can't transfer roles and permissions to new user.")
    }
  }

  override def updateUserProperties(
      organizationId: Long,
      username: String,
      properties: Map[String, String],
      deletedPropertyKeys: Set[String]
  ): Future[UserProfile] = {
    profileService.updateUserProperties(organizationId, username, properties, deletedPropertyKeys)
  }

  override def resetPassword(organizationId: Long, username: String): Future[Boolean] = {
    userService.setPassword(organizationId, username, DEFAULT_PASSWORD, Some(PasswordMode.Raw))
  }
}
