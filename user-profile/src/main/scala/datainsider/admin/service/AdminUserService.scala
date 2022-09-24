package datainsider.admin.service

import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import datainsider.admin.controller.http.request.{DeleteUserRequest, TransferUserDataConfig}
import datainsider.admin.module.ConfigureAccount
import datainsider.authorization.domain.PermissionByUserProviders
import datainsider.client.domain.ThriftImplicit.RichUser
import datainsider.client.domain.user.{User, UserProfile}
import datainsider.client.exception.{InternalError, NotFoundError}
import datainsider.client.service.BIClientService
import datainsider.user_caas.domain.UserType.UserType
import datainsider.user_caas.domain.{Page, UserType}
import datainsider.user_caas.service.{CaasService, UserService}
import datainsider.user_profile.controller.http.request.EditProfileRequest
import datainsider.user_profile.domain.profile.UserFullDetailInfo
import datainsider.user_profile.service.{RegistrationService, UserProfileService}

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

  def delete(organizationId: Long, request: DeleteUserRequest): Future[Boolean]
}

case class AdminUserServiceImpl @Inject() (
    registrationService: RegistrationService,
    caasService: CaasService,
    userService: UserService,
    profileService: UserProfileService,
    biClientService: BIClientService
) extends AdminUserService
    with Logging {

  override def createAdminAccount(organizationId: Long, account: ConfigureAccount): Future[String] = {
    registerAccount(organizationId, account)
  }

  private def registerAccount(organizationId: Long, account: ConfigureAccount): Future[String] = {
    profileService.getUserProfileByEmail(organizationId, account.email).transform {
      case Return(profile) =>
        val userId: String = profile.username
        userService
          .resetPassword(
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
    } yield UserFullDetailInfo(user.toUserInfo, profile)
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
  override def delete(organizationId: Long, request: DeleteUserRequest): Future[Boolean] = {
    for {
      _ <- request.transferDataConfig match {
        case Some(config) => transferRoleAndPermissions(request.organizationId, request.username, config)
        case None         => Future.Unit
      }
      _ <- deleteUser(organizationId, request.username)
      _ <- doMigrateAndDeleteUserData(organizationId, request)
    } yield true
  }

  private def deleteUser(organizationId: Long, username: String): Future[Unit] = {
    userService.deleteUser(organizationId, username)
  }

  private def transferRoleAndPermissions(
      organizationId: Long,
      fromUser: String,
      config: TransferUserDataConfig
  ): Future[Unit] = {
    for {
      targetUsername <- profileService.getUserProfileByEmail(organizationId, config.targetUserEmail).map(_.username)
      transferRoleOK <- userService.transferRoles(organizationId, fromUser, targetUsername)
      transferPermissionOK <- userService.transferPermissions(organizationId, fromUser, targetUsername)
    } yield transferRoleOK && transferPermissionOK match {
      case true  => Unit
      case false => throw InternalError("Can't transfer roles and permissions to new user.")
    }
  }

  private def doMigrateAndDeleteUserData(organizationId: Long, request: DeleteUserRequest): Future[Boolean] = {
    for {
      transferOK <- request.transferDataConfig match {
        case Some(config) => transferDirectoryAndDashboardData(organizationId, request.username, config)
        case None         => Future.True
      }
      _ <- transferOK match {
        case true  => biClientService.deleteUserData(request.username)
        case false => Future.False
      }
    } yield transferOK

  }

  private def transferDirectoryAndDashboardData(
      organizationId: Long,
      fromUser: String,
      config: TransferUserDataConfig
  ): Future[Boolean] = {
    for {
      targetUsername <- profileService.getUserProfileByEmail(organizationId, config.targetUserEmail).map(_.username)
      transferOK <- biClientService.migrateUserData(fromUser, targetUsername)
    } yield transferOK
  }

  override def updateUserProperties(
      organizationId: Long,
      username: String,
      properties: Map[String, String],
      deletedPropertyKeys: Set[String]
  ): Future[UserProfile] = {
    profileService.updateUserProperties(organizationId, username, properties, deletedPropertyKeys)
  }
}
