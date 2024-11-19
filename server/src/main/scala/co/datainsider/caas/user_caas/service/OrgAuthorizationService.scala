package co.datainsider.caas.user_caas.service

import co.datainsider.caas.user_caas.domain.UserGroup.UserGroup
import co.datainsider.caas.user_caas.domain.{OrgStatistics, UserGroup}
import co.datainsider.caas.user_caas.repository.{RoleRepository, UserRepository}
import co.datainsider.caas.user_profile.domain.user.RoleInfo
import co.datainsider.caas.user_profile.service.OrganizationService
import co.datainsider.caas.user_profile.util.Configs.enhancePermissions
import co.datainsider.license.domain.LicensePermission
import co.datainsider.license.domain.permissions.{NumEditorsUsage, NumViewersUsage}
import co.datainsider.license.service.LicenseClientService
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.bi.util.Implicits.{FutureEnhance, async}
import co.datainsider.common.client.exception.{BadRequestError, InsufficientPermissionError}

import javax.inject.Inject

trait OrgAuthorizationService {

  def addRoles(organizationId: Long, username: String, roleIds: Map[Int, Long]): Future[Boolean]

  def removeRoles(organizationId: Long, username: String, roleIds: Set[Int]): Future[Boolean]

  def getActiveRoles(organizationId: Long, username: String): Future[Seq[RoleInfo]]

  def hasRole(organizationId: Long, username: String, roleName: String): Future[Boolean]

  def hasRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Map[String, Boolean]]

  def hasAllRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Boolean]

  def changePermissions(
      organizationId: Long,
      username: String,
      includePermissions: Seq[String],
      excludePermissions: Seq[String],
      isApiKey: Boolean = false
  ): Future[Boolean]

  def addPermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean]

  def removePermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean]

  def getAllPermissions(organizationId: Long, username: String): Future[Seq[String]]

  def isPermitted(organizationId: Long, username: String, permission: String): Future[Boolean]

  def isPermitted(organizationId: Long, username: String, permissions: String*): Future[Map[String, Boolean]]

  def isPermittedAll(organizationId: Long, username: String, permissions: String*): Future[Boolean]

  def isPermittedAtLeastOnce(organizationId: Long, username: String, permissions: String*): Future[Boolean]

  def getStatistics(orgId: Long): Future[OrgStatistics]

  def getUserGroup(orgId: Long, username: String): Future[UserGroup]

  def assignToGroup(orgId: Long, username: String, userGroup: UserGroup): Future[Boolean]

  def checkGroupAvailability(orgId: Long, userGroup: UserGroup): Future[Boolean]

}

case class OrgAuthorizationServiceImpl @Inject() (
    caas: Caas,
    userRepository: UserRepository,
    roleRepository: RoleRepository,
    organizationService: OrganizationService,
    licenseClientService: LicenseClientService
) extends OrgAuthorizationService
    with Logging {

  override def addRoles(organizationId: Long, username: String, roleIds: Map[Int, Long]): Future[Boolean] =
    Future {
      userRepository.addRoles(organizationId, username, roleIds)
    }

  override def removeRoles(organizationId: Long, username: String, roleIds: Set[Int]): Future[Boolean] =
    Future {
      userRepository.removeUserRoles(organizationId, username, roleIds)
      true
    }

  override def getActiveRoles(organizationId: Long, username: String): Future[Seq[RoleInfo]] = {
    userRepository.getAssignedRoles(organizationId, username).map(_.filterNot(_.isExpired))
  }

  override def hasRole(organizationId: Long, username: String, roleName: String): Future[Boolean] =
    Future {
      caas.hasRole(organizationId, username, roleName)
    }

  override def hasRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Map[String, Boolean]] =
    Future {
      val results = caas.hasRoles(organizationId, username, roleName)
      roleName
        .zip(results)
        .map {
          case (roleName, isPermitted) => (roleName -> isPermitted)
        }
        .toMap
    }

  override def hasAllRoles(organizationId: Long, username: String, roleName: Seq[String]): Future[Boolean] =
    Future {
      caas.hasAllRoles(organizationId, username, roleName)
    }

  override def changePermissions(
      organizationId: Long,
      username: String,
      includePermissions: Seq[String],
      excludePermissions: Seq[String],
      isApiKey: Boolean = false
  ): Future[Boolean] = {
    for {
      _ <-
        if (isApiKey) Future.True
        else validateAddedPermissions(organizationId, username, includePermissions, excludePermissions)
      addOK <- addPermissions(organizationId, username, includePermissions)
      removeOK <- removePermissions(organizationId, username, excludePermissions)
    } yield {
      println(addOK, removeOK)
      addOK && removeOK
    }
  }

  override def addPermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] = {
    Future {
      userRepository.insertUserPermissions(organizationId, username, permissions.toSet)
    }.onFailure { ex =>
      error(s"addPermissions: $permissions", ex)
    }
  }

  override def removePermissions(organizationId: Long, username: String, permissions: Seq[String]): Future[Boolean] =
    Future {
      userRepository.deleteUserPermissions(organizationId, username, permissions.toSet)
    }

  override def getAllPermissions(organizationId: Long, username: String): Future[Seq[String]] = {
    Future {
      val perms = userRepository.getAllPermissions(organizationId, username)
      val userPerms = userRepository.getAllPermissions(0, username)
      (perms ++ userPerms).distinct
    }
  }

  override def isPermitted(organizationId: Long, username: String, permission: String): Future[Boolean] =
    Future {
      caas.isPermitted(organizationId, username, permission)
    }

  override def isPermitted(organizationId: Long, username: String, permissions: String*): Future[Map[String, Boolean]] =
    Future {
      val results = caas.isPermitted(organizationId, username, permissions: _*)
      permissions
        .zip(results)
        .map {
          case (permission, isPermitted) => (permission -> isPermitted)
        }
        .toMap
    }

  override def isPermittedAtLeastOnce(organizationId: Long, username: String, permissions: String*): Future[Boolean] = {
    isPermitted(organizationId, username, permissions: _*).map(response => {
      response.exists(_._2)
    })
  }

  override def isPermittedAll(organizationId: Long, username: String, permissions: String*): Future[Boolean] =
    Future {
      caas.isPermittedAll(organizationId, username, permissions: _*)
    }

  override def getStatistics(orgId: Long): Future[OrgStatistics] =
    Future {
      val viewerPerm: String = enhancePermissions(orgId, LicensePermission.ViewData).head
      val editorPerm: String = enhancePermissions(orgId, LicensePermission.EditData).head

      val totalViewPerm: Int = userRepository.countUsersWithPermission(orgId, viewerPerm)
      val totalEditPerm: Int = userRepository.countUsersWithPermission(orgId, editorPerm)

      OrgStatistics(numViewers = totalViewPerm - totalEditPerm, numEditors = totalEditPerm)
    }

  override def getUserGroup(orgId: Long, username: String): Future[UserGroup] =
    Future {
      val viewerPerm: String = enhancePermissions(orgId, LicensePermission.ViewData).head
      val editorPerm: String = enhancePermissions(orgId, LicensePermission.EditData).head

      val Array(hasViewerPerm, hasEditorPerm) = caas.isPermitted(orgId, username, viewerPerm, editorPerm)

      if (hasEditorPerm) {
        UserGroup.Editor
      } else if (hasViewerPerm) {
        UserGroup.Viewer
      } else UserGroup.None
    }

  override def assignToGroup(orgId: Long, username: String, userGroup: UserGroup): Future[Boolean] = {
    userGroup match {
      case UserGroup.Viewer => assignAsViewer(orgId, username)
      case UserGroup.Editor => assignAsEditor(orgId, username)
      case UserGroup.None   => removeGroupPerm(orgId, username)
    }
  }

  override def checkGroupAvailability(orgId: Long, userGroup: UserGroup): Future[Boolean] = {
    userGroup match {
      case UserGroup.Viewer => verifyNumViewers(orgId)
      case UserGroup.Editor => verifyNumEditors(orgId)
      case _                => Future.True
    }
  }

  private def assignAsViewer(orgId: Long, username: String): Future[Boolean] = {
    for {
      _ <- verifyNumViewers(orgId)
      viewPermAdded <- addPermissions(
        organizationId = orgId,
        username = username,
        permissions = enhancePermissions(orgId, LicensePermission.ViewData)
      )
      editPermRemoved <- removePermissions(
        organizationId = orgId,
        username = username,
        permissions = enhancePermissions(orgId, LicensePermission.EditData)
      )
    } yield viewPermAdded && editPermRemoved
  }

  private def assignAsEditor(orgId: Long, username: String): Future[Boolean] = {
    for {
      _ <- verifyNumEditors(orgId)
      permAdded <- addPermissions(
        organizationId = orgId,
        username = username,
        permissions = enhancePermissions(orgId, LicensePermission.ViewData, LicensePermission.EditData)
      )
    } yield permAdded
  }

  private def removeGroupPerm(orgId: Long, username: String): Future[Boolean] = {
    removePermissions(
      organizationId = orgId,
      username = username,
      permissions = enhancePermissions(orgId, LicensePermission.ViewData, LicensePermission.EditData)
    )
  }

  private def validateAddedPermissions(
      orgId: Long,
      username: String,
      includePerms: Seq[String],
      excludePerms: Seq[String]
  ): Future[Boolean] =
    Future {
      val viewerPerm: String = enhancePermissions(orgId, LicensePermission.ViewData).head
      val editorPerm: String = enhancePermissions(orgId, LicensePermission.EditData).head

      val targetUserAllPerms: Seq[String] = userRepository.getAllPermissions(orgId, username)
      val isAlreadyViewer: Boolean = targetUserAllPerms.contains(viewerPerm)
      val isAlreadyEditor: Boolean = targetUserAllPerms.contains(editorPerm)
      val toBeAssignedEditPerms: Boolean = includePerms.exists(perm => !perm.contains(":view:"))

      if (includePerms.contains(viewerPerm) || includePerms.contains(editorPerm)) {
        throw BadRequestError("Can not assign viewer/editor permission here.")
      }

      if (excludePerms.contains(viewerPerm) || excludePerms.contains(editorPerm)) {
        throw BadRequestError("Can not remove viewer/editor permission here.")
      }

      if (!isAlreadyViewer) {
        throw BadRequestError("Target user is not a viewer, can not be assigned any permissions.")
      }

      if (!isAlreadyEditor && toBeAssignedEditPerms) {
        throw BadRequestError("Target user is not an editor, can not be assigned edit permissions.")
      }

      true
    }

  private def verifyNumEditors(orgId: Long): Future[Boolean] = {
    for {
      orgStatistics <- getStatistics(orgId)
      licenseKey <- organizationService.getOrganization(orgId).map(_.get.licenceKey)
      isPermitted <- licenseClientService.verify(licenseKey, NumEditorsUsage(orgStatistics.numEditors + 1))
    } yield {
      if (!isPermitted) {
        throw InsufficientPermissionError(
          s"License reaches limit, can not perform this action, license ${licenseKey}, current number of editors: ${orgStatistics.numEditors}"
        )
      } else true
    }
  }

  private def verifyNumViewers(orgId: Long): Future[Boolean] = {
    for {
      orgStatistics <- getStatistics(orgId)
      licenseKey <- organizationService.getOrganization(orgId).map(_.get.licenceKey)
      isPermitted <- licenseClientService.verify(licenseKey, NumViewersUsage(orgStatistics.numViewers + 1))
    } yield {
      if (!isPermitted) {
        throw InsufficientPermissionError(
          s"License reaches limit, can not perform this action, license ${licenseKey}, current number of viewers: ${orgStatistics.numViewers}"
        )
      } else true
    }
  }

  // TODO: just for migrating data for existing system, remove these code later.
  private def addGroupPermissionToExistingSystem(): Future[Unit] =
    async {
      val organizations = organizationService.getAllOrganizations(0, 100).syncGet()

      organizations.data.foreach(org => {
        addGroupPermissionToExistingOrg(org.organizationId)
      })

      logger.info(s"finish adding group permissions to ${organizations.total} orgs.")
    }.rescue {
      case e: Throwable =>
        logger.error(s"addGroupPermissionToExistingSystem failed with message: ${e.getMessage}", e)
    }

  private def addGroupPermissionToExistingOrg(orgId: Long): Unit = {
    try {
      val viewerPerm: String = enhancePermissions(orgId, LicensePermission.ViewData).head
      val editorPerm: String = enhancePermissions(orgId, LicensePermission.EditData).head

      val totalViewPerm: Int = userRepository.countUsersWithPermission(orgId, viewerPerm)
      val totalEditPerm: Int = userRepository.countUsersWithPermission(orgId, editorPerm)

      if (totalEditPerm == 0 && totalViewPerm == 0) {
        addEditorPermToExistingUsers(orgId)
      }

      logger.info(s"finish adding group permissions to org $orgId.")
    } catch {
      case e: Throwable =>
        logger.error(s"addGroupPermissionToExistingOrg failed for org: ${orgId}, message: ${e.getMessage}")
    }
  }

  private def addEditorPermToExistingUsers(orgId: Long): Unit = {
    try {
      val userIds = userRepository.listUserIds(orgId, isActive = Some(true), from = 0, size = 100)

      userIds.data.foreach(userId => {
        addPermissions(
          organizationId = orgId,
          username = userId,
          permissions = enhancePermissions(orgId, LicensePermission.ViewData, LicensePermission.EditData)
        )
      })

      logger.info(s"added editor permissions to ${userIds.total} users.")
    } catch {
      case e: Throwable =>
        logger.error(s"addEditorPermToExistingUsers failed for org: ${orgId}, message: ${e.getMessage}")
    }
  }

  // addGroupPermissionToExistingSystem()

}
