package co.datainsider.share.service

import co.datainsider.bi.domain.DirectoryType
import co.datainsider.bi.service.DirectoryService
import co.datainsider.share.repository.ShareRepository
import co.datainsider.share.service.Permissions.{getAvailablePermissions, buildPermissions, copyPermissionsToResourceId}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.service.OrgAuthorizationClientService

import javax.inject.Inject

case class DirectoryPermissionAssigner @Inject() (
    directoryService: DirectoryService,
    orgAuthorizationClientService: OrgAuthorizationClientService,
    shareRepository: ShareRepository
) extends Logging {

  def assign(
      organizationId: Long,
      resourceId: String,
      userActions: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]] = {
    val fn: Map[String, Future[Boolean]] = userActions.map {
      case (username, actions) =>
        val result = for {
          childrenIds <- directoryService.listChildrenIds(resourceId.toInt)
          permissions = buildPermissions(
            organizationId,
            DirectoryType.Directory.toString,
            childrenIds.map(_.toString) :+ resourceId,
            actions
          )
          isOk <- orgAuthorizationClientService.addPermissions(organizationId, username, permissions).rescue {
            case ex: Throwable =>
              logger.error(s"Can't assign permissions for $username")
              Future.False
          }
        } yield isOk
        username -> result
    }
    Future.collect(fn)
  }

  def copySharedUserPermissions(
      organizationId: Long,
      childrenId: String,
      parentUserPermissions: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]] = {
    val fn = parentUserPermissions.map {
      case (username, permissions) =>
        val newPermissions: Seq[String] =
          copyPermissionsToResourceId(organizationId, childrenId, DirectoryType.Directory.toString, permissions)
        val isOk: Future[Boolean] =
          orgAuthorizationClientService.addPermissions(organizationId, username, newPermissions)
        username -> isOk
    }
    Future.collect(fn)
  }

  def copyOwnerPermission(
      organizationId: Long,
      parentId: String,
      childrenId: String,
      ownerId: String
  ): Future[Boolean] = {
    val permissions: Seq[String] = getAvailablePermissions(organizationId, DirectoryType.Directory.toString, parentId)
    for {
      parentPermissions <- orgAuthorizationClientService.isPermitted(organizationId, ownerId, permissions: _*)
      newPermissions = copyPermissionsToResourceId(
        organizationId,
        childrenId,
        DirectoryType.Directory.toString,
        parentPermissions.filter(_._2).keys.toSeq
      )
      result <- orgAuthorizationClientService.addPermissions(organizationId, ownerId, newPermissions)
    } yield result
  }
}
