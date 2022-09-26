package datainsider.user_caas.repository

import com.twitter.util.Future
import datainsider.client.domain.user.{RoleInfo, User}
import datainsider.user_caas.domain.Page
import datainsider.user_caas.domain.UserType.UserType

/**
  * @author andy
  * @since 8/4/20
  * */

trait UserRepository {

  def insertUser(
      organizationId: Long,
      username: String,
      passwordHashed: String,
      isActive: Boolean,
      createTime: Long,
      userType: Option[UserType] = None
  ): User

  /**
    * Insert a new user with the given password hash
    */
  def insertUser(organizationId: Long, username: String, passwordHashed: String): User

  def insertUserPermission(organizationId: Long, username: String, permission: String): Boolean

  def insertUserPermissions(organizationId: Long, username: String, permissions: Set[String]): Boolean

  def getUserRole(organizationId: Long, username: String, roleId: Int): Option[RoleInfo]

  def addRole(organizationId: Long, username: String, roleId: Int, expireTime: Long): Boolean

  def addRoles(organizationId: Long, username: String, roleIds: Map[Int, Long]): Boolean

  def isPasswordCorrect(organizationId: Long, username: String, password: String): Boolean

  def isActiveUser(organizationId: Long, username: String, password: String): Boolean

  def isActiveUsername(organizationId: Long, username: String): Boolean

  def isExistUser(organizationId: Long, username: String): Boolean

  def getUserInfo(organizationId: Long, username: String): Future[User]

  def syncGetUserInfo(organizationId: Long, username: String): User

  def changeUserActiveStatus(organizationId: Long, username: String, isActive: Boolean): Boolean

  def resetPassword(organizationId: Long, username: String, password: String): Boolean

  def resetPassword(organizationId: Long, username: String, oldPass: String, newPass: String): Boolean

  def deleteUser(organizationId: Long, username: String): Unit

  def getAllPermissions(organizationId: Long, username: String): Seq[String]

  def getUserPermissions(organizationId: Long, username: String): Future[Seq[String]]

  def syncGetUserPermissions(organizationId: Long, username: String): Seq[String]

  def getAllRoleNames(organizationId: Long, username: String): Seq[String]

  def getAssignedRoles(organizationId: Long, username: String): Future[Seq[RoleInfo]]

  def syncGetActiveRoles(organizationId: Long, username: String): Seq[RoleInfo]

  def getActiveAssignedRoleIds(organizationId: Long, username: String): Future[Seq[Int]]

  def getAllUsername(organizationId: Long, userType: Option[UserType] = None): Seq[String]

  def listUserIds(
      organizationId: Long,
      isActive: Option[Boolean],
      from: Int,
      size: Int,
      userType: Option[UserType] = None
  ): Page[String]

  def countAllUserInfo(organizationId: Long, userType: Option[UserType] = None): Int

  def getAllUserWithRoleInfo(
      organizationId: Long,
      isActive: Option[Boolean],
      from: Int,
      size: Int,
      userType: Option[UserType] = None
  ): Page[User]

  def searchUserRoleInfo(
      organizationId: Long,
      searchUsername: String,
      from: Int,
      size: Int,
      userType: Option[UserType] = None
  ): Seq[User]

  def countUserRoleInfo(organizationId: Long, searchUsername: String, userType: Option[UserType] = None): Int

  def getListUserRoleInfoWithHighestRoleFilter(
      organizationId: Long,
      notInRoleIds: Seq[Int],
      inRoleIds: Seq[Int],
      from: Int,
      size: Int,
      userType: Option[UserType] = None
  ): Page[User]

  def searchUserRoleInfoWithHighestRoleFilter(
      searchUsername: String,
      organizationId: Long,
      notInRoleIds: Seq[Int],
      inRoleIds: Seq[Int],
      from: Int,
      size: Int,
      userType: Option[UserType] = None
  ): Page[User]

  def replaceUserPermission(
      organizationId: Long,
      username: String,
      oldPermissions: Seq[String],
      newPermissions: Seq[String]
  )

  def deleteUserPermission(organizationId: Long, username: String, permission: String): Unit

  def deleteUserPermissions(organizationId: Long, username: String, permissions: Set[String]): Boolean

  def removeUserRole(organizationId: Long, username: String, roleId: Int): Unit

  def removeUserRoles(organizationId: Long, username: String, roleIds: Set[Int]): Unit

  def replaceUserRole(organizationId: Long, username: String, oldRoleIds: Set[Int], newRoleIds: Map[Int, Long])

  def getListUserByUsernames(organizationId: Long, usernames: Seq[String]): Seq[User]

}
