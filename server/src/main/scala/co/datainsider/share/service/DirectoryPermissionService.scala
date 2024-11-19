package co.datainsider.share.service

import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain.DirectoryType
import co.datainsider.bi.service.DirectoryService
import com.google.inject.Inject
import com.twitter.util.Future
import co.datainsider.common.authorization.domain.PermissionProviders
import co.datainsider.caas.user_profile.client.OrgAuthorizationClientService

import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author tvc12 - Thien Vi
  * @created 03/22/2021 - 6:02 PM
  */
trait DirectoryPermissionService {
  def isPermitted(
      orgId: Long,
      username: String,
      directoryId: DirectoryId,
      action: String
  ): Future[Boolean]
  def isPermitted(
      orgId: Long,
      username: String,
      directoryId: DirectoryId,
      actions: Seq[String]
  ): Future[Map[String, Boolean]]

  def isPermitted(tokenId: String, orgId: Long, directoryId: DirectoryId, action: String): Future[Boolean]
  def isPermitted(
      tokenId: String,
      orgId: Long,
      directoryId: DirectoryId,
      actions: Seq[String]
  ): Future[Map[String, Boolean]]
}
@deprecated
case class DirectoryPermissionServiceImpl @Inject() (
    directoryService: DirectoryService,
    orgAuthService: OrgAuthorizationClientService,
    permissionTokenService: PermissionTokenService
) extends DirectoryPermissionService {
  override def isPermitted(
      orgId: Long,
      username: String,
      directoryId: DirectoryId,
      action: String
  ): Future[Boolean] = {
    for {
      permissions <- buildPermissions(orgId, directoryId, action)
      results <- orgAuthService.isPermitted(orgId, username, permissions: _*)
    } yield results.exists(_._2)
  }

  private def buildPermissions(orgId: Long, id: DirectoryId, action: String): Future[Seq[String]] = {
    val basePermissions = Seq(
      PermissionProviders.permissionBuilder.perm(orgId, DirectoryType.Directory.toString, action, id.toString)
    )
    for {
      parentIds <- directoryService.listParentIds(orgId, id)
      parentPermissions =
        parentIds
          .map(parentId =>
            PermissionProviders.permissionBuilder
              .perm(orgId, DirectoryType.Directory.toString, action, parentId.toString)
          )
    } yield (basePermissions ++ parentPermissions).distinct
  }

  override def isPermitted(
      tokenId: String,
      orgId: DirectoryId,
      directoryId: DirectoryId,
      action: String
  ): Future[Boolean] = {
    for {
      permissions <- buildPermissions(orgId, directoryId, action)
      results <- permissionTokenService.isPermitted(tokenId, permissions)
    } yield results.exists(result => result)
  }

  override def isPermitted(
      orgId: DirectoryId,
      username: String,
      directoryId: DirectoryId,
      actions: Seq[String]
  ): Future[Map[String, Boolean]] = {
    val fn = actions
      .map(action => {
        action -> isPermitted(orgId, username, directoryId, action)
      })
      .toMap
    Future.collect(fn)
  }

  override def isPermitted(
      tokenId: String,
      orgId: DirectoryId,
      directoryId: DirectoryId,
      actions: Seq[String]
  ): Future[Map[String, Boolean]] = {
    val fn = actions
      .map(action => {
        action -> isPermitted(tokenId, orgId, directoryId, action)
      })
      .toMap
    Future.collect(fn)
  }
}

case class DirectoryPermissionServiceImplV2 @Inject() (
    directoryService: DirectoryService,
    orgAuthService: OrgAuthorizationClientService,
    permissionTokenService: PermissionTokenService
) extends DirectoryPermissionService {
  override def isPermitted(
      orgId: Long,
      username: String,
      directoryId: DirectoryId,
      action: String
  ): Future[Boolean] = {
    val permission =
      PermissionProviders.permissionBuilder.perm(
        orgId,
        DirectoryType.Directory.toString,
        action,
        directoryId.toString
      )
    orgAuthService.isPermitted(orgId, username, permission)
  }

  override def isPermitted(
      tokenId: String,
      orgId: DirectoryId,
      directoryId: DirectoryId,
      action: String
  ): Future[Boolean] = {
    val permission =
      PermissionProviders.permissionBuilder.perm(
        orgId,
        DirectoryType.Directory.toString,
        action,
        directoryId.toString
      )
    permissionTokenService.isPermitted(tokenId, permission)
  }

  override def isPermitted(
      orgId: DirectoryId,
      username: String,
      directoryId: DirectoryId,
      actions: Seq[String]
  ): Future[Map[String, Boolean]] = {
    val fn = actions
      .map(action => {
        val permission = PermissionProviders.permissionBuilder
          .perm(orgId, DirectoryType.Directory.toString, action, directoryId.toString)
        action -> orgAuthService.isPermitted(orgId, username, permission)
      })
      .toMap
    Future.collect(fn)
  }

  override def isPermitted(
      tokenId: String,
      orgId: DirectoryId,
      directoryId: DirectoryId,
      actions: Seq[String]
  ): Future[Map[String, Boolean]] = {
    val fn = actions
      .map(action => {
        val permission = PermissionProviders.permissionBuilder
          .perm(orgId, DirectoryType.Directory.toString, action, directoryId.toString)
        action -> permissionTokenService.isPermitted(tokenId, permission)
      })
      .toMap
    Future.collect(fn)
  }
}
