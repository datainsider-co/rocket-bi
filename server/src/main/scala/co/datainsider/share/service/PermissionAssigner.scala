package co.datainsider.share.service

import co.datainsider.bi.domain.DirectoryType
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.service.DirectoryService
import co.datainsider.share.repository.ShareRepository
import co.datainsider.share.service.Permissions.{buildPermissions, copyPermissionsToResourceId, getAvailablePermissions}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import co.datainsider.caas.user_profile.client.OrgAuthorizationClientService

import javax.inject.Inject

trait PermissionAssigner {

  /**
    * assign recur permissions to a directory resource include this directory and all sub directories
    */
  def assignRecurPermissions(
      organizationId: Long,
      dirId: DirectoryId,
      userActionMap: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]]

  /**
    * assign permissions to directories resource
    */
  def assignPermissions(
      organizationId: Long,
      dirIds: Seq[DirectoryId],
      username: String,
      actions: Set[String]
  ): Future[Boolean]

  /**
    * assign permissions to directory and all sub directories
    */
  def assignRecurPermissions(
      organizationId: Long,
      dirId: DirectoryId,
      username: String,
      actions: Set[String]
  ): Future[Boolean]

  def copySharedUserPermissions(
      organizationId: Long,
      childrenId: String,
      parentUserPermissions: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]]

  def copyOwnerPermission(
      organizationId: Long,
      parentId: String,
      childrenId: String,
      ownerId: String
  ): Future[Boolean]
}
case class PermissionAssignerImpl @Inject() (
    directoryService: DirectoryService,
    orgAuthorizationClient: OrgAuthorizationClientService,
    shareRepository: ShareRepository
) extends PermissionAssigner
    with Logging {

  override def assignRecurPermissions(
      organizationId: Long,
      dirId: DirectoryId,
      userActionMap: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]] = {
    val fn: Map[String, Future[Boolean]] = userActionMap.map {
      case (username, actions) => username -> assignRecurPermissions(organizationId, dirId, username, actions.toSet)
    }
    Future.collect(fn)
  }

  /**
    * assign permissions to only this directories id, not recursive
    */
  override def assignPermissions(
      organizationId: Long,
      dirIds: Seq[DirectoryId],
      username: String,
      actions: Set[String]
  ): Future[Boolean] = {
    val permissions: Seq[String] =
      buildPermissions(organizationId, DirectoryType.Directory.toString, dirIds.distinct.map(_.toString), actions.toSeq)
    orgAuthorizationClient.addPermissions(organizationId, username, permissions).rescue {
      case ex: Throwable =>
        logger.error(s"Can't assign permissions ${permissions} for $username", ex)
        Future.False
    }
  }

  /**
    * assign permissions to this directory and all sub-directories recursively
    */
  override def assignRecurPermissions(
      organizationId: Long,
      dirId: DirectoryId,
      username: String,
      actions: Set[String]
  ): Future[Boolean] = {
    for {
      childrenIds <- directoryService.listChildrenIds(organizationId, dirId)
      isOk <- assignPermissions(organizationId, Seq(dirId) ++ childrenIds, username, actions)
    } yield isOk
  }

  override def copySharedUserPermissions(
      organizationId: Long,
      childrenId: String,
      parentUserPermissions: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]] = {
    val fn = parentUserPermissions.map {
      case (username, permissions) =>
        val newPermissions: Seq[String] =
          copyPermissionsToResourceId(organizationId, childrenId, DirectoryType.Directory.toString, permissions)
        val isOk: Future[Boolean] = orgAuthorizationClient.addPermissions(organizationId, username, newPermissions)
        username -> isOk
    }
    Future.collect(fn)
  }

  override def copyOwnerPermission(
      organizationId: Long,
      parentId: String,
      childrenId: String,
      ownerId: String
  ): Future[Boolean] = {
    val permissions: Seq[String] = getAvailablePermissions(organizationId, DirectoryType.Directory.toString, parentId)
    for {
      parentPermissions <- orgAuthorizationClient.isPermitted(organizationId, ownerId, permissions: _*)
      newPermissions = copyPermissionsToResourceId(
        organizationId,
        childrenId,
        DirectoryType.Directory.toString,
        parentPermissions.filter(_._2).keys.toSeq
      )
      result <- orgAuthorizationClient.addPermissions(organizationId, ownerId, newPermissions)
    } yield result
  }
}

class MockPermissionAssigner extends PermissionAssigner {
  override def assignRecurPermissions(
      organizationId: DirectoryId,
      dirId: DirectoryId,
      userActionMap: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]] = Future.value(Map.empty)

  override def assignPermissions(
      organizationId: DirectoryId,
      dirIds: Seq[DirectoryId],
      username: String,
      actions: Set[String]
  ): Future[Boolean] = Future.True

  override def assignRecurPermissions(
      organizationId: DirectoryId,
      dirId: DirectoryId,
      username: String,
      actions: Set[String]
  ): Future[Boolean] = Future.True

  override def copySharedUserPermissions(
      organizationId: DirectoryId,
      childrenId: String,
      parentUserPermissions: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]] = Future.value(Map.empty)

  override def copyOwnerPermission(
      organizationId: DirectoryId,
      parentId: String,
      childrenId: String,
      ownerId: String
  ): Future[Boolean] = Future.True
}
