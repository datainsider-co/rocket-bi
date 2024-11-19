package co.datainsider.share.service

import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain.{DirectoryType, PermissionToken, TokenFullInfo}
import co.datainsider.bi.service.{DashboardService, DirectoryService}
import co.datainsider.bi.util.SchemaImplicits.ActionListEnhanceImplicits
import co.datainsider.caas.user_profile.client.{OrgAuthorizationClientService, ProfileClientService}
import co.datainsider.share.controller.request._
import co.datainsider.share.domain.response.{PageResult, ResourceSharingInfo, SharingInfo, UserSharingInfo}
import co.datainsider.share.repository.ShareRepository
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import co.datainsider.common.authorization.domain.PermissionProviders
import co.datainsider.caas.user_profile.domain.user.UserProfile

import javax.inject.Inject

case class DirectoryShareServiceImpl @Inject() (
    directoryService: DirectoryService,
    dashboardService: DashboardService,
    shareRepository: ShareRepository,
    profileService: ProfileClientService,
    permissionTokenService: PermissionTokenService,
    orgAuthorizationClientService: OrgAuthorizationClientService,
    permissionAssigner: PermissionAssigner
) extends ShareService
    with Logging {

  import Permissions._

  private def getOwnerResource(organizationId: Long, resourceType: String, resourceId: String): Future[UserProfile] = {
    DirectoryType.withName(resourceType) match {
      case DirectoryType.Directory => directoryService.getOwner(organizationId, resourceId.toLong)
      case DirectoryType.Dashboard | DirectoryType.Queries =>
        dashboardService.getOwner(organizationId, resourceId.toLong)
      case DirectoryType.RetentionAnalysis | DirectoryType.FunnelAnalysis | DirectoryType.EventAnalysis |
          DirectoryType.PathExplorer =>
        directoryService.getOwner(organizationId, resourceId.toLong)
    }
  }

  private def getOrCreateShareToken(request: ShareAnyoneRequest): Future[String] = {
    val permissions =
      request.actions.map(
        PermissionProviders.permissionBuilder
          .perm(request.currentOrganizationId.get, request.resourceType, _, request.resourceId)
      )
    permissionTokenService.getOrCreateToken(
      GetOrCreatePermissionTokenRequest(
        request.resourceType,
        request.resourceId,
        Some(permissions),
        request.request
      )
    )
  }

  override def share(organizationId: Long, request: ShareAnyoneRequest): Future[PermissionToken] = {
    for {
      id <- getOrCreateShareToken(request)
      tokenInfo <- permissionTokenService.getToken(id)
    } yield tokenInfo
  }

  def getPermissions(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String]
  ): Future[Map[String, Seq[String]]] = {
    val allPerms = getAvailablePermissions(organizationId, resourceType, resourceId)
    val fn = usernames
      .map(username => {
        val permissions = orgAuthorizationClientService
          .isPermitted(organizationId, username, allPerms: _*)
          .map(_.filter(_._2).keys.toSeq)
        username -> permissions
      })
      .toMap
    Future.collect(fn)
  }

  def createListUserSharingInfo(
      sharingInfos: Seq[SharingInfo],
      userProfileAsMap: Map[String, UserProfile],
      permissions: Map[String, Seq[String]]
  ): Seq[UserSharingInfo] = {
    sharingInfos
      .filter(sharingInfo => {
        userProfileAsMap.isDefinedAt(sharingInfo.username) && permissions.isDefinedAt(sharingInfo.username)
      })
      .map(sharingInfo => {
        val user = userProfileAsMap(sharingInfo.username)
        val currentPermissions = permissions(sharingInfo.username)
        sharingInfo.createUserSharingInfo(user, currentPermissions)
      })
  }

  def getProfiles(organizationId: Long, usernames: Seq[String]): Future[Map[String, UserProfile]] = {
    if (usernames.nonEmpty) {
      profileService.getUserProfiles(organizationId, usernames).map(_.toMap)
    } else {
      Future.value(Map.empty[String, UserProfile])
    }
  }

  def getUserProfilesSharing(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      from: Int,
      size: Int
  ): Future[PageResult[UserSharingInfo]] = {
    for {
      shareInfos <- shareRepository.getSharingInfos(organizationId, resourceType, resourceId, from, size)
      usernames = shareInfos.data.map(_.username)
      userProfileAsMap <- getProfiles(organizationId, usernames)
      permissionAsMap <- getPermissions(organizationId, resourceType, resourceId, usernames)
    } yield {
      val listUserSharing = createListUserSharingInfo(shareInfos.data, userProfileAsMap, permissionAsMap)
      PageResult(shareInfos.total, listUserSharing)
    }
  }

  override def getInfo(
      organizationId: Long,
      request: GetResourceSharingInfoRequest
  ): Future[ResourceSharingInfo] = {
    for {
      owner <- getOwnerResource(organizationId, request.resourceType, request.resourceId)
      results <-
        getUserProfilesSharing(organizationId, request.resourceType, request.resourceId, request.from, request.size)
    } yield {
      ResourceSharingInfo(owner = owner, totalUserSharing = results.total, usersSharing = results.data)
    }
  }

  def updateUserPermissions(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      userPermissions: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]] = {
    val fn = userPermissions.map {
      case (username, permissions) =>
        for {
          childrenIds <- directoryService.listChildrenIds(organizationId, resourceId.toLong)
          includeAndExcludePermissions = buildIncludeAndExcludePermissions(
            organizationId,
            permissions,
            childrenIds.map(_.toString) :+ resourceId,
            DirectoryType.Directory.toString
          )
          result <- orgAuthorizationClientService.changePermissions(
            organizationId,
            username,
            includeAndExcludePermissions.includePermissions,
            includeAndExcludePermissions.excludePermissions
          )
        } yield username -> result
    }.toSeq
    Future.collect(fn).map(_.toMap)
  }

  override def multiUpdate(
      organizationId: Long,
      request: MultiUpdateResourceSharingRequest
  ): Future[Map[String, Boolean]] = {
    val shareIds: Seq[String] = request.shareIdActions.keySet.toSeq
    for {
      _ <- shareRepository.updateUpdatedTimeShareInfo(shareIds)
      shareInfos <- shareRepository.getSharingInfos(shareIds)
      userPermissionsAsMap: Map[String, Seq[String]] =
        shareInfos
          .map(shareInfo => {
            val permissions =
              request
                .shareIdActions(shareInfo.id)
                .toPermissions(organizationId, request.resourceType, request.resourceId)
            shareInfo.username -> permissions
          })
          .toMap
      results <- updateUserPermissions(organizationId, request.resourceType, request.resourceId, userPermissionsAsMap)
    } yield results

  }

  override def revoke(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String]
  ): Future[Map[String, Boolean]] = {
    for {
      childrenIds <- directoryService.listChildrenIds(organizationId, resourceId.toInt)
      allResourceIds = childrenIds.map(_.toString) :+ resourceId
      _ <- removeSharedInfos(organizationId, DirectoryType.Directory.toString, allResourceIds, usernames)
      result <- removePermissions(organizationId, DirectoryType.Directory.toString, allResourceIds, usernames)
    } yield result
  }

  private def removePermissions(
      organizationId: Long,
      resourceType: String,
      resourceIds: Seq[String],
      usernames: Seq[String]
  ): Future[Map[String, Boolean]] = {
    val allPerms = buildPermissions(organizationId, resourceType, resourceIds, ActionUtil.ALL_ACTIONS.toSeq)
    val fn = usernames
      .map(username => {
        val result = orgAuthorizationClientService.removePermissions(organizationId, username, allPerms)
        username -> result
      })
      .toMap

    Future.collect(fn)
  }

  private def removeSharedInfos(
      organizationId: Long,
      resourceType: String,
      directoryIds: Seq[String],
      usernames: Seq[String]
  ): Future[Seq[Boolean]] = {
    val fn = directoryIds.map(id =>
      shareRepository.softDelete(
        organizationId,
        resourceType,
        id,
        usernames
      )
    )
    Future.collect(fn)
  }

  override def listResourceIdSharing(
      organizationId: Long,
      resourceType: String,
      userId: String,
      from: Option[Int],
      size: Option[Int]
  ): Future[PageResult[String]] = {
    shareRepository.getResourceIds(organizationId, resourceType, userId, from.getOrElse(0), size.getOrElse(20))
  }

  override def share(organizationId: Long, request: ShareWithUserRequest): Future[Map[String, Boolean]] = {
    for {
      childrenDirIds <- directoryService.listChildrenIds(organizationId, request.resourceId.toInt)
      userAssignedAsMap <- permissionAssigner.assignRecurPermissions(
        organizationId,
        request.resourceId.toLong,
        request.userActions
      )
      _ <- saveSharedInfos(
        organizationId,
        childrenDirIds,
        userAssignedAsMap.filter(_._2).keys.toSeq,
        request.currentUsername,
        isRoot = false
      )
      _ <- saveSharedInfo(
        organizationId,
        request.resourceId,
        DirectoryType.Directory.toString,
        userAssignedAsMap.filter(_._2).keys.toSeq,
        request.currentUsername,
        isRoot = true
      )
    } yield {
      userAssignedAsMap
    }
  }

  private def share(
      organizationId: Long,
      resourceId: String,
      userActions: Map[String, Seq[String]],
      creator: String
  ): Future[Map[String, Boolean]] = {
    for {
      childrenDirIds <- directoryService.listChildrenIds(organizationId, resourceId.toInt)
      userAssignedAsMap <- permissionAssigner.assignRecurPermissions(
        organizationId,
        resourceId.toLong,
        userActions
      )
      _ <- saveSharedInfos(
        organizationId,
        childrenDirIds,
        userAssignedAsMap.filter(_._2).keys.toSeq,
        creator,
        isRoot = false
      )
      _ <- saveSharedInfo(
        organizationId,
        resourceId,
        DirectoryType.Directory.toString,
        userAssignedAsMap.filter(_._2).keys.toSeq,
        creator,
        isRoot = true
      )
    } yield {
      userAssignedAsMap
    }
  }

  override def revokeShareAnyone(organizationId: Long, resourceType: String, resourceId: String): Future[Boolean] = {
    permissionTokenService.deleteToken(resourceType, resourceId)
  }

  override def getInfo(organizationId: Long, request: GetShareAnyoneInfoRequest): Future[Option[PermissionToken]] = {
    permissionTokenService.getToken(request.resourceType, request.resourceId)
  }

  override def update(organizationId: Long, request: UpdateShareAnyoneRequest): Future[Boolean] = {
    for {
      maybeTokenId <- permissionTokenService.getTokenId(request.resourceType, request.resourceId)
      isSuccess <- maybeTokenId match {
        case Some(tokenId) =>
          permissionTokenService.updatePermission(
            tokenId,
            request.actions.toPermissions(organizationId, request.resourceType, request.resourceId)
          )
        case _ => Future.False
      }
    } yield isSuccess
  }

  override def isShared(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String]
  ): Future[Map[String, Boolean]] = {
    shareRepository.isShared(organizationId, resourceType, resourceId, usernames)
  }

  def removeUsersShared(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String]
  ): Future[Seq[String]] = {
    isShared(organizationId, resourceType, resourceId, usernames)
      .map(_.filterNot(_._2).keys.toSeq)
  }

  private def assignPermissions(
      organizationId: Long,
      usernames: Seq[String],
      permissions: Seq[String]
  ): Future[Map[String, Boolean]] = {
    val fn = usernames
      .map(username => {
        username -> orgAuthorizationClientService.addPermissions(organizationId, username, permissions)
      })
      .toMap
    Future.collect(fn)
  }

  private def canInvite(tokenFullInfo: TokenFullInfo, resourceType: String, resourceId: String): Boolean = {
    resourceType.equals(tokenFullInfo.objectType) && resourceId.equals(tokenFullInfo.objectId)
  }

  override def invite(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String],
      tokenId: String
  ): Future[Map[String, Boolean]] = {
    permissionTokenService.getFullInfo(tokenId).flatMap {
      case Some(tokenFullInfo) if (canInvite(tokenFullInfo, resourceType, resourceId)) =>
        val usersNotContainsOwner = usernames.filterNot(_.equals(tokenFullInfo.creator))
        val actions = getActions(tokenFullInfo.permissions)
        val userActions = usersNotContainsOwner.map(username => username -> actions).toMap
        for {
          //usersNotSharing <- removeUsersShared(organizationId, resourceType, resourceId, usersNotContainsOwner)
          results <- share(organizationId, resourceId, userActions, tokenFullInfo.creator)
        } yield results
      case ex => Future.value(Map.empty[String, Boolean])
    }
  }

  override def isShared(
      organizationId: Long,
      resourceType: String,
      resourceIds: Seq[String],
      username: String
  ): Future[Map[String, Boolean]] = {
    if (resourceIds.nonEmpty) {
      shareRepository.isShared(organizationId, resourceType, resourceIds, username)
    } else {
      Future.value(Map.empty[String, Boolean])
    }
  }

  override def saveSharedInfo(
      organizationId: Long,
      resourceId: String,
      resourceType: String,
      usernames: Seq[String],
      creator: String,
      isRoot: Boolean = false
  ): Future[Boolean] = {
    shareRepository.shareWithUsers(organizationId, resourceType, resourceId, usernames, creator, isRoot)
  }

  private def saveSharedInfos(
      organizationId: Long,
      resourceIds: Seq[DirectoryId],
      usernames: Seq[String],
      creator: String,
      isRoot: Boolean
  ): Future[Seq[Boolean]] = {
    val fn = resourceIds.map(id => {
      shareRepository.shareWithUsers(
        organizationId,
        resourceType = DirectoryType.Directory.toString,
        resourceId = id.toString,
        usernames = usernames,
        creator = creator,
        isRoot
      )
    })
    Future.collect(fn)
  }

  override def getAllInfo(
      organizationId: DirectoryId,
      resourceId: String,
      resourceType: String
  ): Future[Seq[UserSharingInfo]] = {
    for {
      shareInfos <- shareRepository.getAllSharingInfos(organizationId, resourceId, resourceType)
      usernames = shareInfos.map(_.username)
      userProfileAsMap <- getProfiles(organizationId, usernames)
      permissionAsMap <- getPermissions(organizationId, resourceType, resourceId, usernames)
    } yield {
      createListUserSharingInfo(shareInfos, userProfileAsMap, permissionAsMap)
    }
  }

  override def copyPermissionFromParent(
      organizationId: DirectoryId,
      childrenId: String,
      parentId: String,
      resourceType: String,
      creatorId: String,
      ownerId: String
  ): Future[Map[String, Boolean]] = {
    for {
      _ <- permissionAssigner.copyOwnerPermission(organizationId, parentId, childrenId, ownerId)
      shareInfos <- getAllInfo(organizationId, parentId, resourceType)
      userPermissions: Map[String, Seq[String]] = shareInfos.map(info => info.user.username -> info.permissions).toMap
      userAssignedAsMap <- permissionAssigner.copySharedUserPermissions(organizationId, childrenId, userPermissions)
      _ <- saveSharedInfo(
        organizationId,
        childrenId,
        resourceType,
        userAssignedAsMap.filter(_._2).keys.toSeq,
        creatorId
      )
    } yield userAssignedAsMap
  }

  override def listSharedRootIds(
      organizationId: DirectoryId,
      resourceType: String,
      userId: String,
      from: Option[Int],
      size: Option[Int]
  ): Future[PageResult[String]] = {
    shareRepository.getResourceIds(
      organizationId,
      resourceType,
      userId,
      from.getOrElse(0),
      size.getOrElse(20),
      Some(true)
    )
  }

  override def cleanup(organizationId: Long): Future[Boolean] = {
    shareRepository.deleteByOrgId(organizationId)
  }
}
