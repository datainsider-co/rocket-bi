package co.datainsider.schema.service

import co.datainsider.bi.util.SchemaImplicits.ActionListEnhanceImplicits
import co.datainsider.caas.user_profile.client.{OrgAuthorizationClientService, ProfileClientService}
import co.datainsider.schema.domain.{PageResult, ResourceInfo, SharingInfo, UserSharingInfo}
import co.datainsider.schema.domain.requests.{GetResourceSharingInfoRequest, MultiUpdateResourceSharingRequest, PermResourceType, RevokeDatabasePermissionsRequest, ShareWithUserRequest}
import co.datainsider.schema.repository.ShareRepository
import co.datainsider.schema.service.Permissions.{buildAllSharePermissions, getIncludeAndExcludePermissions}
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import co.datainsider.caas.user_profile.domain.user.UserProfile
import co.datainsider.share.controller.request.ActionUtil

import javax.inject.Inject

object Permissions {
  def getIncludeAndExcludePermissions(
      newPermissions: Seq[String],
      permittedAsMap: Map[String, Boolean]
  ): (Seq[String], Seq[String]) = {
    val oldPermissions: Set[String] = permittedAsMap.filter(_._2).keySet
    val includePermissions: Set[String] = newPermissions.toSet
    val excludePermissions: Seq[String] = oldPermissions.diff(includePermissions).toSeq
    (includePermissions.toSeq, excludePermissions)
  }

  def buildAllSharePermissions(organizationId: Long, resourceType: String, resourceId: String): Seq[String] = {
    ActionUtil.ALL_ACTIONS.map { action =>
      PermissionProviders.permissionBuilder.perm(organizationId, resourceType, action, resourceId)
    }.toSeq
  }
}

trait ShareService {

  def getInfo(organizationId: Long, request: GetResourceSharingInfoRequest): Future[ResourceInfo]

  def share(organizationId: Long, request: ShareWithUserRequest): Future[Map[String, Boolean]]

  def multiUpdate(
      organizationId: Long,
      request: MultiUpdateResourceSharingRequest
  ): Future[Map[String, Boolean]]

  def revokePermissions(organizationId: Long, request: RevokeDatabasePermissionsRequest): Future[Map[String, Boolean]]

  def checkPermissions(organizationId: Long, userName: String, database: String, action: String): Future[Boolean]

  def assignUserPermissions(
      organizationId: Long,
      database: String,
      userActions: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]]
}

class ShareServiceImpl @Inject() (
    orgAuthorizationClientService: OrgAuthorizationClientService,
    shareRepository: ShareRepository,
    profileService: ProfileClientService,
    schemaService: SchemaService
) extends ShareService {

  override def getInfo(
      organizationId: Long,
      request: GetResourceSharingInfoRequest
  ): Future[ResourceInfo] = {
    for {
      owner <- getOwner(organizationId, request.dbName)
      shareInfos <- shareRepository.getSharingInfos(
        organizationId,
        PermResourceType.Database.toString,
        request.dbName,
        request.from,
        request.size
      )
      usernames = shareInfos.data.map(_.username)
      userProfileAsMap <- getProfiles(organizationId, usernames)
      permissionAsMap <- getPermissions(organizationId, PermResourceType.Database.toString, request.dbName, usernames)
    } yield {
      val listUserSharing: Seq[UserSharingInfo] =
        createListUserSharingInfo(shareInfos.data, userProfileAsMap, permissionAsMap)
      val results: PageResult[UserSharingInfo] = PageResult(shareInfos.total, listUserSharing)
      ResourceInfo(owner = owner, totalUserSharing = results.total, usersSharing = results.data)
    }
  }

  override def share(organizationId: Long, request: ShareWithUserRequest): Future[Map[String, Boolean]] = {
    assignUserPermissions(organizationId, request.dbName, request.userActions)
    for {
      listUserAssignedPermissions <- assignUserPermissions(organizationId, request.dbName, request.userActions)
      _ <- shareRepository.shareWithUsers(
        organizationId,
        PermResourceType.Database.toString,
        request.dbName,
        listUserAssignedPermissions.filter(_._2).keys.toSeq,
        request.currentUsername
      )
    } yield {
      listUserAssignedPermissions
    }
  }

  override def assignUserPermissions(
      organizationId: Long,
      database: String,
      userActions: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]] = {
    val fn: Map[String, Future[Boolean]] = userActions.map {
      case (username, actions) =>
        val permissions: Seq[String] =
          actions.map(action =>
            PermissionProviders.permissionBuilder
              .perm(organizationId, PermResourceType.Database.toString, action, database)
          )
        username -> orgAuthorizationClientService.addPermissions(organizationId, username, permissions).rescue {
          case ex: Throwable =>
            Future.False
        }
    }
    Future.collect(fn)
  }

  override def multiUpdate(
      organizationId: Long,
      request: MultiUpdateResourceSharingRequest
  ): Future[Map[String, Boolean]] = {
    val shareIds: Seq[String] = request.shareIdActions.keySet.toSeq
    for {
      _ <- shareRepository.updateUpdatedTimeShareInfo(shareIds)
      shareInfos <- shareRepository.getSharingInfos(shareIds)
      userPermissions =
        shareInfos
          .map(shareInfo => {
            val permissions: Seq[String] =
              request
                .shareIdActions(shareInfo.id)
                .toPermissions(organizationId, PermResourceType.Database.toString, request.dbName)
            shareInfo.username -> permissions
          })
          .toMap
      results <-
        updateUserPermissions(organizationId, PermResourceType.Database.toString, request.dbName, userPermissions)
    } yield results

  }

  def updateUserPermissions(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      userPermissions: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]] = {
    val allPerms: Seq[String] = buildAllSharePermissions(organizationId, resourceType, resourceId)
    val fn: Seq[Future[(String, Boolean)]] = userPermissions.map {
      case (username, newPermissions) => {
        for {
          permittedAsMap <- orgAuthorizationClientService.isPermitted(organizationId, username, allPerms: _*)
          (includePermissions, excludePermissions) = getIncludeAndExcludePermissions(newPermissions, permittedAsMap)
          result <- orgAuthorizationClientService.changePermissions(
            organizationId,
            username,
            includePermissions,
            excludePermissions
          )
        } yield username -> result
      }
    }.toSeq
    Future.collect(fn).map(_.toMap)
  }

  override def revokePermissions(
      organizationId: Long,
      request: RevokeDatabasePermissionsRequest
  ): Future[Map[String, Boolean]] = {
    for {
      _ <- shareRepository.softDelete(
        organizationId,
        PermResourceType.Database.toString,
        request.dbName,
        request.usernames
      )
      results <-
        removePermissions(organizationId, PermResourceType.Database.toString, request.dbName, request.usernames)
    } yield results
  }

  private def removePermissions(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String]
  ): Future[Map[String, Boolean]] = {
    val allPerms: Seq[String] = buildAllSharePermissions(organizationId, resourceType, resourceId)

    val fn: Map[String, Future[Boolean]] = usernames
      .map(username => {
        username -> orgAuthorizationClientService
          .removePermissions(organizationId, username, allPerms)
      })
      .toMap

    Future.collect(fn)
  }

  override def checkPermissions(
      organizationId: Long,
      userName: String,
      dbName: String,
      action: String
  ): Future[Boolean] = {
    val permission: String =
      PermissionProviders.permissionBuilder.perm(organizationId, PermResourceType.Database.toString, action, dbName)
    orgAuthorizationClientService.isPermitted(organizationId, userName, permission)
  }

  def getProfiles(organizationId: Long, usernames: Seq[String]): Future[Map[String, UserProfile]] = {
    if (usernames.nonEmpty) {
      profileService.getUserProfiles(organizationId, usernames).map(_.toMap)
    } else {
      Future.value(Map.empty[String, UserProfile])
    }
  }

  def getPermissions(
      organizationId: Long,
      resourceType: String,
      resourceId: String,
      usernames: Seq[String]
  ): Future[Map[String, Seq[String]]] = {
    val allPerms: Seq[String] = buildAllSharePermissions(organizationId, resourceType, resourceId)
    val fn: Map[String, Future[Seq[String]]] = usernames
      .map(username => {
        val permissions: Future[Seq[String]] = orgAuthorizationClientService
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
        val user: UserProfile = userProfileAsMap(sharingInfo.username)
        val currentPermissions: Seq[String] = permissions(sharingInfo.username)
        sharingInfo.createUserSharingInfo(user, currentPermissions)
      })
  }

  private def getOwner(organizationId: Long, dbName: String): Future[Option[UserProfile]] = {
    for {
      databaseSchema <- schemaService.getDatabaseSchema(organizationId, dbName)
      username =
        if (databaseSchema.creatorId != null)
          databaseSchema.creatorId
        else
          "up-83fa61ea-b4fb-4b48-bd93-872d6aaad42e" // TODO: wtf??
      owner <- profileService.getUserProfile(organizationId, username)
    } yield owner
  }
}
