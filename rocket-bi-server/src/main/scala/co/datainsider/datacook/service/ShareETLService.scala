package co.datainsider.datacook.service

import co.datainsider.bi.util.SchemaImplicits.ActionListEnhanceImplicits
import co.datainsider.caas.user_profile.client.{OrgAuthorizationClientService, ProfileClientService}
import co.datainsider.caas.user_profile.domain.user.UserProfile
import co.datainsider.datacook.domain.Ids.{OrganizationId, ShareId, UserId}
import co.datainsider.datacook.domain.MockData.mockListSharedEtlJobs
import co.datainsider.datacook.domain.request.etl.ListEtlJobsRequest
import co.datainsider.datacook.domain.request.share.{
  ListSharedUserRequest,
  RevokeShareRequest,
  ShareEtlToUsersRequest,
  UpdateShareRequest
}
import co.datainsider.datacook.domain.response.EtlJobResponse
import co.datainsider.datacook.repository.ShareETLRepository
import co.datainsider.schema.domain.requests.PermResourceType
import co.datainsider.schema.domain.{PageResult, ResourceInfo, SharingInfo, UserSharingInfo}
import co.datainsider.schema.service.Permissions.{buildAllSharePermissions, getIncludeAndExcludePermissions}
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders

import javax.inject.Inject

/**
  * Service for share ETL
  *
  * @author tvc12 - Thien Vi
  */
trait ShareETLService {

  /**
    * List ETL Jobs share with me
    */
  @deprecated("use listSharedEtlJobs in EtlJobService instead of")
  def listSharedEtlJobs(organizationId: OrganizationId, request: ListEtlJobsRequest): Future[PageResult[EtlJobResponse]]

  /**
    * Lấy danh sách user được share
    */
  def listSharedUsers(organizationId: Long, request: ListSharedUserRequest): Future[ResourceInfo]

  /**
    * Share ETL cho users
    * @return Map[String, Boolean] kết quả user đó được share thành công hay thất bại
    */
  def share(organizationId: Long, request: ShareEtlToUsersRequest): Future[Map[UserId, Boolean]]

  /**
    * Update thông tin share của users, thay đổi quyền
    * @return kết quả thay đổi quyền thành công hay thất bại
    */
  def update(organizationId: Long, request: UpdateShareRequest): Future[Map[ShareId, Boolean]]

  /**
    * Revoke share cho users
    * @return kết quả share thành công hay thất bại
    */
  def revoke(organizationId: Long, request: RevokeShareRequest): Future[Map[UserId, Boolean]]
}

class ShareETLServiceImpl @Inject() (
    etlShareRepository: ShareETLRepository,
    etlJobService: ETLService,
    profileClientService: ProfileClientService,
    orgAuthorizationClientService: OrgAuthorizationClientService
) extends ShareETLService {

  /**
    * List ETL Jobs share with me
    */
  override def listSharedEtlJobs(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobResponse]] = {
    etlJobService.listSharedEtlJobs(organizationId, request)
  }

  /**
    * Lấy danh sách user được share
    */
  override def listSharedUsers(organizationId: OrganizationId, request: ListSharedUserRequest): Future[ResourceInfo] = {
    for {
      shareInfos <- etlShareRepository.getSharingInfos(
        organizationId,
        PermResourceType.ETL.toString,
        request.id.toString,
        request.from,
        request.size
      )
      etlJob <- etlJobService.getJob(organizationId, request.id)
      owner <- profileClientService.getUserProfile(organizationId, etlJob.ownerId)
      usernames = shareInfos.data.map(_.username)
      userProfileAsMap <- getProfiles(organizationId, usernames)
      permissionAsMap <- getPermissions(organizationId, PermResourceType.ETL.toString, request.id.toString, usernames)
    } yield {
      val listUserSharing: Seq[UserSharingInfo] =
        createListUserSharingInfo(shareInfos.data, userProfileAsMap, permissionAsMap)
      val results: PageResult[UserSharingInfo] = PageResult(shareInfos.total, listUserSharing)
      ResourceInfo(owner = owner, totalUserSharing = results.total, usersSharing = results.data)
    }
  }

  def getProfiles(organizationId: Long, usernames: Seq[String]): Future[Map[String, UserProfile]] = {
    if (usernames.nonEmpty) {
      profileClientService.getUserProfiles(organizationId, usernames).map(_.toMap)
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

  /**
    * Share ETL cho users
    *
    * @return Map[String, Boolean] kết quả user đó được share thành công hay thất bại
    */
  override def share(organizationId: OrganizationId, request: ShareEtlToUsersRequest): Future[Map[UserId, Boolean]] = {
    for {
      listUserAssignedPermissions <- assignUserPermissions(organizationId, request.id.toString, request.userActions)
      _ <- etlShareRepository.shareWithUsers(
        organizationId,
        PermResourceType.ETL.toString,
        request.id.toString,
        listUserAssignedPermissions.filter(_._2).keys.toSeq,
        request.currentUsername
      )
    } yield {
      listUserAssignedPermissions
    }
  }

  private def assignUserPermissions(
      organizationId: Long,
      resourceId: String,
      userActions: Map[String, Seq[String]]
  ): Future[Map[String, Boolean]] = {
    val fn: Map[String, Future[Boolean]] = userActions.map {
      case (username, actions) =>
        val permissions: Seq[String] =
          actions.map(action =>
            PermissionProviders.permissionBuilder
              .perm(organizationId, PermResourceType.ETL.toString, action, resourceId)
          )
        username -> orgAuthorizationClientService.addPermissions(organizationId, username, permissions).rescue {
          case _: Throwable =>
            Future.False
        }
    }
    Future.collect(fn)
  }

  /**
    * Update thông tin share của users, thay đổi quyền
    *
    * @return kết quả thay đổi quyền thành công hay thất bại
    */
  override def update(organizationId: OrganizationId, request: UpdateShareRequest): Future[Map[ShareId, Boolean]] = {
    val shareIds: Seq[String] = request.shareIdActions.keySet.toSeq
    for {
      _ <- etlShareRepository.updateUpdatedTimeShareInfo(shareIds)
      shareInfos <- etlShareRepository.getSharingInfos(shareIds)
      userPermissions =
        shareInfos
          .map(shareInfo => {
            val permissions: Seq[String] =
              request
                .shareIdActions(shareInfo.id)
                .toPermissions(organizationId, PermResourceType.ETL.toString, request.id.toString)
            shareInfo.username -> permissions
          })
          .toMap
      results <-
        updateUserPermissions(organizationId, PermResourceType.ETL.toString, request.id.toString, userPermissions)
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
      case (username, newPermissions) =>
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
    }.toSeq
    Future.collect(fn).map(_.toMap)
  }

  /**
    * Revoke share cho users
    *
    * @return kết quả share thành công hay thất bại
    */
  override def revoke(organizationId: OrganizationId, request: RevokeShareRequest): Future[Map[UserId, Boolean]] = {
    for {
      _ <- etlShareRepository.softDelete(
        organizationId,
        PermResourceType.ETL.toString,
        request.id.toString,
        request.usernames
      )
      results <-
        removePermissions(organizationId, PermResourceType.ETL.toString, request.id.toString, request.usernames)
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
}

class MockShareETLService extends ShareETLService {

  /**
    * Lấy danh sách user được share
    */
  override def listSharedUsers(organizationId: Long, request: ListSharedUserRequest): Future[ResourceInfo] =
    Future {
      ResourceInfo(
        owner = Some(UserProfile("tvc12", Some("Thien Vi"), None, None)),
        totalUserSharing = 0,
        usersSharing = Seq.empty
      )
    }

  /**
    * Share ETL cho users
    *
    * @return Map[String, Boolean] kết quả user đó được share thành công hay thất bại
    */
  override def share(organizationId: Long, request: ShareEtlToUsersRequest): Future[Map[UserId, Boolean]] =
    Future {
      Map("tvc12" -> true, "thien_vi" -> false)
    }

  /**
    * Update thông tin share của users, thay đổi quyền
    *
    * @return kết quả thay đổi quyền thành công hay thất bại
    */
  override def update(organizationId: Long, request: UpdateShareRequest): Future[Map[ShareId, Boolean]] =
    Future {
      Map("123" -> true, "456" -> false)
    }

  /**
    * Revoke share cho users
    *
    * @return kết quả share thành công hay thất bại
    */
  override def revoke(organizationId: Long, request: RevokeShareRequest): Future[Map[UserId, Boolean]] =
    Future {
      Map("tvc12" -> true, "thien_vi" -> false)
    }

  /**
    * List ETL Jobs share with me
    */
  override def listSharedEtlJobs(
      organizationId: OrganizationId,
      request: ListEtlJobsRequest
  ): Future[PageResult[EtlJobResponse]] = {
    Future.value(mockListSharedEtlJobs)
  }
}
