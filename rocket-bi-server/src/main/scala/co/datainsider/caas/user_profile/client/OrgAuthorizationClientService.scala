package co.datainsider.caas.user_profile.client

import co.datainsider.caas.user_caas.service.{OrgAuthorizationService, UserService}
import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.client.domain.Page
import co.datainsider.caas.user_profile.domain.user.{RoleInfo, UserInfo}

trait OrgAuthorizationClientService {

  def addRoles(organizationId: Long, username: String, roleIds: Map[Int, Long]): Future[Boolean]

  def removeRoles(organizationId: Long, username: String, roleIds: Set[Int]): Future[Boolean]

  def getActiveRoleList(organizationId: Long, username: String): Future[Seq[RoleInfo]]

  def getListUserByRoles(
      organizationId: Long,
      notInRoleIds: Option[Seq[Int]],
      inRoleIds: Option[Seq[Int]],
      from: Int,
      size: Int
  ): Future[Page[UserInfo]]

  def searchListUserByRoles(
      keyword: String,
      organizationId: Long,
      notInRoleIds: Option[Seq[Int]],
      inRoleIds: Option[Seq[Int]],
      from: Int,
      size: Int
  ): Future[Page[UserInfo]]

  def hasRole(organizationId: Long, username: String, roleName: String): Future[Boolean]

  def hasRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Map[String, Boolean]]

  def hasAllRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Boolean]

  def addPermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean]

  def removePermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean]

  def getAllPermissions(organizationId: Long, username: String): Future[Seq[String]]

  def isPermitted(organizationId: Long, username: String, permission: String): Future[Boolean]

  def isPermitted(organizationId: Long, username: String, permissions: String*): Future[Map[String, Boolean]]

  def isPermittedAll(organizationId: Long, username: String, permissions: String*): Future[Boolean]

  def changePermissions(
      organizationId: Long,
      username: String,
      includePermissions: Seq[String],
      excludePermissions: Seq[String]
  ): Future[Boolean]
}

class OrgAuthorizationClientServiceImpl @Inject() (
    orgAuthorizationService: OrgAuthorizationService,
    userService: UserService
) extends OrgAuthorizationClientService {
  override def addRoles(organizationId: Long, username: String, roleIds: Map[Int, Long]): Future[Boolean] = {
    orgAuthorizationService.addRoles(organizationId, username, roleIds)
  }

  override def removeRoles(organizationId: Long, username: String, roleIds: Set[Int]): Future[Boolean] = {
    orgAuthorizationService.removeRoles(organizationId, username, roleIds)
  }

  override def getActiveRoleList(organizationId: Long, username: String): Future[Seq[RoleInfo]] = {
    orgAuthorizationService.getActiveRoles(organizationId, username)
  }

  override def getListUserByRoles(
      organizationId: Long,
      notInRoleIds: Option[Seq[Int]],
      inRoleIds: Option[Seq[Int]],
      from: Int,
      size: Int
  ): Future[Page[UserInfo]] = ???

  override def searchListUserByRoles(
      keyword: String,
      organizationId: Long,
      notInRoleIds: Option[Seq[Int]],
      inRoleIds: Option[Seq[Int]],
      from: Int,
      size: Int
  ): Future[Page[UserInfo]] = ???

  override def hasRole(organizationId: Long, username: String, roleName: String): Future[Boolean] = {
    orgAuthorizationService.hasRole(organizationId, username, roleName)
  }

  override def hasRoles(
      organizationId: Long,
      username: String,
      roleNames: Seq[String]
  ): Future[Map[String, Boolean]] = {
    orgAuthorizationService.hasRoles(organizationId, username, roleNames)
  }

  override def hasAllRoles(organizationId: Long, username: String, roleNames: Seq[String]): Future[Boolean] = {
    orgAuthorizationService.hasAllRoles(organizationId, username, roleNames)
  }

  override def addPermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] = {
    orgAuthorizationService.addPermissions(organizationId, username, permissions)
  }

  override def removePermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] = {
    orgAuthorizationService.removePermissions(organizationId, username, permissions)
  }

  override def getAllPermissions(organizationId: Long, username: String): Future[Seq[String]] = {
    orgAuthorizationService.getAllPermissions(organizationId, username)
  }

  override def isPermitted(organizationId: Long, username: String, permission: String): Future[Boolean] = {
    orgAuthorizationService.isPermitted(organizationId, username, permission)
  }

  override def isPermitted(
      organizationId: Long,
      username: String,
      permissions: String*
  ): Future[Map[String, Boolean]] = {
    orgAuthorizationService.isPermitted(organizationId, username, permissions: _*)
  }

  override def isPermittedAll(organizationId: Long, username: String, permissions: String*): Future[Boolean] = {
    orgAuthorizationService.isPermittedAll(organizationId, username, permissions: _*)
  }

  override def changePermissions(
      organizationId: Long,
      username: String,
      includePermissions: Seq[String],
      excludePermissions: Seq[String]
  ): Future[Boolean] = {
    orgAuthorizationService.changePermissions(organizationId, username, includePermissions, excludePermissions)
  }
}

class MockOrgAuthorizationClientServiceImpl() extends OrgAuthorizationClientService {

  override def addRoles(organizationId: Long, username: String, roleIds: Map[Int, Long]): Future[Boolean] = {
    Future.True
  }

  override def removeRoles(organizationId: Long, username: String, roleIds: Set[Int]): Future[Boolean] = {
    Future.True
  }

  override def getActiveRoleList(organizationId: Long, username: String): Future[Seq[RoleInfo]] = {
    Future.value(
      Seq(
        RoleInfo(1, "admin", Long.MaxValue, permissions = Set("*:*")),
        RoleInfo(1, "manager", Long.MaxValue, permissions = Set("timetable:*"))
      )
    )
  }

  override def getListUserByRoles(
      organizationId: Long,
      notInRoleIds: Option[Seq[Int]] = None,
      inRoleIds: Option[Seq[Int]] = None,
      from: Int,
      size: Int
  ): Future[Page[UserInfo]] = {
    Future.value(Page(0, Seq.empty))
  }

  override def searchListUserByRoles(
      keyword: String,
      organizationId: Long,
      notInRoleIds: Option[Seq[Int]],
      inRoleIds: Option[Seq[Int]],
      from: Int,
      size: Int
  ): Future[Page[UserInfo]] = {
    Future.value(Page(0, Seq.empty))
  }

  override def hasRole(organizationId: Long, username: String, roleName: String): Future[Boolean] = {
    Future.True
  }

  override def hasRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Map[String, Boolean]] = {
    Future.value(roleName.map(roleName => roleName -> true).toMap)
  }

  override def hasAllRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Boolean] = {
    Future.True
  }

  override def addPermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] = {
    Future.True
  }

  override def removePermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] = {
    Future.True
  }

  override def getAllPermissions(organizationId: Long, username: String): Future[Seq[String]] = {
    Future.value(Seq("*:*", "timetable:*"))
  }

  override def isPermitted(organizationId: Long, username: String, permission: String): Future[Boolean] = {
    Future.True
  }

  override def isPermitted(
      organizationId: Long,
      username: String,
      permissions: String*
  ): Future[Map[String, Boolean]] = {
    Future.value(permissions.map(permission => permission -> true).toMap)
  }

  override def isPermittedAll(organizationId: Long, username: String, permissions: String*): Future[Boolean] = {
    Future.True
  }

  override def changePermissions(
      organizationId: Long,
      username: String,
      includePermissions: Seq[String],
      excludePermissions: Seq[String]
  ): Future[Boolean] = Future.True
}
