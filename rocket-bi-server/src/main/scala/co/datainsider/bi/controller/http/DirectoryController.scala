package co.datainsider.bi.controller.http

import co.datainsider.bi.controller.http.filter._
import co.datainsider.bi.domain.Directory
import co.datainsider.bi.domain.Directory.{MyData, Shared}
import co.datainsider.bi.domain.Ids.{DirectoryId, UserId}
import co.datainsider.bi.domain.request._
import co.datainsider.bi.domain.response.{DirectoryResponse, ParentDirectoriesResponse}
import co.datainsider.bi.service._
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import co.datainsider.caas.user_profile.client.ProfileClientService
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.controller.http.filter.{MustLoggedInFilter, PermissionFilter}
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.util.Future
import datainsider.client.domain.ThriftImplicit.RichUserProfileLike
import co.datainsider.caas.user_profile.domain.user.{ShortUserProfile, UserProfile}
import datainsider.client.exception.{BadRequestError, NotFoundError, UnAuthorizedError, UnsupportedError}
import co.datainsider.license.domain.LicensePermission

class DirectoryController @Inject() (
    directoryService: DirectoryService,
    profileService: ProfileClientService,
    deletedDirectoryService: DeletedDirectoryService,
    starredDirectoryService: StarredDirectoryService,
    recentDirectoryService: RecentDirectoryService,
    directoryFilter: DirectoryPermissionFilter,
    permissionFilter: PermissionFilter,
    adminService: AdminService
) extends Controller {

  filter[ShareTokenParser]
    .filter(
      OrFilter(
        directoryFilter.requireDirectoryOwner("id"),
        directoryFilter.requireUserPermission("view", "id"),
        directoryFilter.requireTokenPermission("view", "id")
      )
    )
    .filter[InviteToDirectoryFilter]
    .get(s"/directories/:id") { request: GetDirectoryRequest =>
      Profiler(s"/directories/:id GET") {
        val user: UserProfile = getUserProfile(request.request)
        val directoryResponse: Future[DirectoryResponse] =
          directoryService.get(request).map(toDirectoryResponse(_, Some(user.toShortUserProfile)))
        directoryResponse
      }
    }

  filter[MustLoggedInFilter]
    .get(s"/directories/root") { request: GetRootDirectoryRequest =>
      Profiler(s"/directories/root") {
        val user: UserProfile = getUserProfile(request.request)
        val directoryResponse: Future[DirectoryResponse] =
          directoryService.getRootDir(request).map(toDirectoryResponse(_, Some(user.toShortUserProfile)))
        directoryResponse
      }
    }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id"),
      directoryFilter.requireUserPermission("view", "id"),
      directoryFilter.requireTokenPermission("view", "id")
    )
  ).filter[InviteToDirectoryFilter]
    .post(s"/directories/:id/list") { request: ListDirectoriesRequest =>
      Profiler(s"/directories/:id/list") {
        val directoryResponses: Future[Array[DirectoryResponse]] =
          request.request.getLongParam("id") match {
            case MyData => listMyDataDirectory(request)
            case Shared => listSharedRootDirectories(request)
            case currentId: Long if (currentId > 0L) =>
              list(request.copy(parentId = Some(currentId), isRemoved = Some(false)))
            case _ => Future.exception(BadRequestError("Directory id invalid"))
          }
        directoryResponses
      }
    }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id"),
      directoryFilter.requireUserPermission("view", "id"),
      directoryFilter.requireTokenPermission("view", "id")
    )
  ).filter[InviteToDirectoryFilter]
    .post(s"/directories/:id/list/shared") { request: ListDirectoriesRequest =>
      Profiler(s"/directories/:id/list/shared") {
        val directoryResponses: Future[Array[DirectoryResponse]] =
          request.request.getLongParam("id") match {
            case Shared => listSharedRootDirectories(request)
            case currentId: Long if (currentId > 0L) =>
              listSharedDirs(request.copy(parentId = Some(currentId), isRemoved = Some(false)))
            case _ => Future.exception(BadRequestError("Directory id invalid"))
          }
        directoryResponses
      }
    }

  private def listSharedRootDirectories(request: ListDirectoriesRequest): Future[Array[DirectoryResponse]] = {
    val organizationId = getOrganizationId(request.currentOrganizationId)
    val username = request.currentUsername
    for {
      directories: Array[Directory] <- directoryService.listSharedRoot(request.copy(isRemoved = Some(false)))
      directoryResponses: Array[DirectoryResponse] <- enhanceWithUserProfile(organizationId, directories)
      response <- enhanceWithStarDirs(organizationId, username, directoryResponses)
    } yield response
  }

  filter[MustLoggedInFilter]
    .post(s"/directories/quick_list") { request: ListDirectoriesRequest =>
      Profiler(s"/directories/quick_list") {
        directoryService.quickList(request)
      }
    }

  private def listMyDataDirectory(request: ListDirectoriesRequest): Future[Array[DirectoryResponse]] = {
    for {
      sharedDirectoryResponses <- listSharedRootDirectories(request)
      rootId: DirectoryId <- getRootId(request.request)
      directoryResponses: Array[DirectoryResponse] <- list(
        request.copy(parentId = Some(rootId), isRemoved = Some(false))
      )
    } yield directoryResponses.union(sharedDirectoryResponses).distinct
  }

  private def getRootId(request: Request): Future[DirectoryId] = {
    directoryService.getRootDir(GetRootDirectoryRequest(request)).map(_.id)
  }

  private def list(listDirectoriesRequest: ListDirectoriesRequest): Future[Array[DirectoryResponse]] = {
    val organizationId = getOrganizationId(listDirectoriesRequest.currentOrganizationId)
    val username = listDirectoriesRequest.currentUsername
    for {
      directories: Array[Directory] <- directoryService.list(listDirectoriesRequest)
      directoryResponses: Array[DirectoryResponse] <- enhanceWithUserProfile(organizationId, directories)
      response <- enhanceWithStarDirs(organizationId, username, directoryResponses)
    } yield response
  }

  filter[MustLoggedInFilter]
    .filter(
      OrFilter(
        directoryFilter.requireDirectoryOwner("parent_id"),
        directoryFilter.requireUserPermission("create", "parent_id"),
        directoryFilter.requireTokenPermission("create", "parent_id")
      )
    )
    .post(s"/directories/create") { request: CreateDirectoryRequest =>
      Profiler(s"/directories/create")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Directory,
        resourceId = null,
        description = s"create directory '${request.name}''"
      ) {
        for {
          parentDirectoryId: DirectoryId <- request.parentId match {
            case MyData => getRootId(request.request)
            case Shared => Future.exception(UnsupportedError("can't create directory in shared folder"))
            case _      => Future.value(request.parentId)
          }
          user: UserProfile = getUserProfile(request.request)
          directoryResponse: DirectoryResponse <-
            directoryService
              .create(request.copy(parentId = parentDirectoryId))
              .map(toDirectoryResponse(_, Some(user.toShortUserProfile)))
        } yield directoryResponse
      }
    }

  filter[MustLoggedInFilter]
    .filter(
      OrFilter(
        directoryFilter.requireDirectoryOwner("id"),
        directoryFilter.requireUserPermission("edit", "id"),
        directoryFilter.requireTokenPermission("edit", "id")
      )
    )
    .put(s"/directories/:id") { request: UpdateDirectoryRequest =>
      Profiler(s"/directories/:id")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Directory,
        resourceId = request.id.toString,
        description = s"update directory id '${request.id}''"
      ) {
        val user: UserProfile = getUserProfile(request.request)
        directoryService
          .updateDirectory(request.getOrganizationId(), request.id, request.data)
          .map(toDirectoryResponse(_, Some(user.toShortUserProfile)))
      }
    }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id"),
      directoryFilter.requireUserPermission("edit", "id"),
      directoryFilter.requireTokenPermission("edit", "id")
    )
  ).put(s"/directories/:id/rename") { request: RenameDirectoryRequest =>
    Profiler(s"/directories/:id/rename")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.Directory,
      resourceId = request.id.toString,
      description = s"rename directory to '${request.toName}'"
    ) {
      directoryService.rename(request).map(toResponse)
    }
  }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id"),
      directoryFilter.requireUserPermission("edit", "id"),
      directoryFilter.requireTokenPermission("edit", "id")
    )
  ).put(s"/directories/:id/move") { request: MoveDirectoryRequest =>
    Profiler(s"/directories/:id/move")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.Directory,
      resourceId = request.id.toString,
      description = s"move directory ${request.id} into directory ${request.toParentId}"
    ) {
      directoryService.move(request.getOrganizationId(), request.id, request.toParentId).map(toResponse)
    }
  }

  filter[MustLoggedInFilter]
    .post(s"/directories/removed/list") { request: ListDirectoriesRequest =>
      Profiler(s"/directories/removed/list") {
        val userId: String = request.currentUser.username
        val organizationId = getOrganizationId(request.currentOrganizationId)
        for {
          directories: Array[Directory] <-
            directoryService.list(request.copy(ownerId = Some(userId), isRemoved = Some(true)))
          directoryResponses: Array[DirectoryResponse] <- enhanceWithUserProfile(organizationId, directories)
        } yield directoryResponses
      }
    }

  filter[MustLoggedInFilter]
    .post(s"/directories/shared/list") { request: ListDirectoriesRequest =>
      Profiler(s"/directories/shared/list") {
        val directoryResponses: Future[Array[DirectoryResponse]] = listShared(request)
        directoryResponses
      }
    }

  @deprecated
  private def listShared(request: ListDirectoriesRequest): Future[Array[DirectoryResponse]] = {
    val userId: String = request.currentUser.username
    val organizationId = getOrganizationId(request.currentOrganizationId)
    for {
      directories: Array[Directory] <- directoryService.listShared(request.copy(isRemoved = Some(false)))
      directoryResponses: Array[DirectoryResponse] <- enhanceWithUserProfile(organizationId, directories)
      response <- enhanceWithStarDirs(organizationId, userId, directoryResponses)
    } yield response
  }

  private def listSharedDirs(request: ListDirectoriesRequest): Future[Array[DirectoryResponse]] = {
    val username: String = request.currentUser.username
    val organizationId = getOrganizationId(request.currentOrganizationId)
    for {
      directories: Array[Directory] <- directoryService.listSharedDirectories(request.copy(isRemoved = Some(false)))
      directoryResponses: Array[DirectoryResponse] <- enhanceWithUserProfile(organizationId, directories)
      response <- enhanceWithStarDirs(organizationId, username, directoryResponses)
    } yield response
  }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id"),
      directoryFilter.requireUserPermission("view", "id"),
      directoryFilter.requireTokenPermission("view", "id")
    )
  ).get(s"/directories/:id/parents") { request: GetDirectoryRequest =>
    Profiler(s"/directories/:id/parents") {
      request.id match {
        case MyData =>
          for {
            parentId: DirectoryId <- getRootId(request.request)
            directoriesResponse: ParentDirectoriesResponse <- directoryService.listParents(request.copy(id = parentId))
          } yield directoriesResponse
        case Shared                            => directoryService.listParentsShared(request)
        case directoryId if (directoryId > 0L) => directoryService.listParents(request)
        case _                                 => Future.exception(BadRequestError("Directory id invalid"))
      }
    }
  }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id"),
      directoryFilter.requireUserPermission("delete", "id"),
      directoryFilter.requireTokenPermission("delete", "id")
    )
  ).delete(s"/directories/:id") { request: DeleteDirectoryRequest =>
    Profiler(s"/directories/:id DELETE")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Delete,
      resourceType = ResourceType.Directory,
      resourceId = request.id.toString,
      description = s"delete directory ${request.id}"
    ) {
      directoryService.hardDelete(request.getOrganizationId(), request.id).map(toResponse)
    }
  }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id"),
      directoryFilter.requireUserPermission("delete", "id"),
      directoryFilter.requireTokenPermission("delete", "id")
    )
  ).put(s"/directories/:id/remove") { request: DeleteDirectoryRequest =>
    Profiler(s"/directories/:id/remove")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Delete,
      resourceType = ResourceType.Directory,
      resourceId = request.id.toString,
      description = s"remove directory ${request.id}"
    ) {
      val orgId: Long = request.getOrganizationId()
      for {
        _ <- recentDirectoryService.delete(orgId, request.id)
        response <- directoryService.softDelete(request.getOrganizationId(), request.id).map(toResponse)
      } yield response
    }
  }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id", isDeleted = true),
      directoryFilter.requireUserPermission("delete", "id"),
      directoryFilter.requireTokenPermission("delete", "id")
    )
  ).put(s"/directories/:id/restore") { request: DeleteDirectoryRequest =>
    Profiler(s"/directories/:id/restore")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Delete,
      resourceType = ResourceType.Directory,
      resourceId = request.id.toString,
      description = s"restore directory ${request.id}"
    ) {
      deletedDirectoryService.restore(request.getOrganizationId(), request.id).map(toResponse)
    }
  }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id", isDeleted = true),
      directoryFilter.requireUserPermission("delete", "id"),
      directoryFilter.requireTokenPermission("delete", "id")
    )
  ).delete(s"/directories/trash/:id/delete") { request: DeleteDirectoryRequest =>
    Profiler(s"/directories/trash/:id/delete")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Delete,
      resourceType = ResourceType.Directory,
      resourceId = request.id.toString,
      description = s"delete directory ${request.id} from trash"
    ) {
      deletedDirectoryService.permanentDeleteDirectory(request.getOrganizationId(), request.id).map(toResponse)
    }
  }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id"),
      directoryFilter.requireUserPermission("edit", "id"),
      directoryFilter.requireTokenPermission("edit", "id")
    )
  ).post(s"/directories/:id/star") { request: Request =>
    Profiler(s"/directories/:id/star")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.Directory,
      resourceId = request.getLongParam("id").toString,
      description = s"add directory ${request.getLongParam("id")} to favorite"
    ) {
      val organizationId = getOrganizationId(request.currentOrganizationId)
      val username = request.currentUsername
      val id = request.getLongParam("id")
      starredDirectoryService.star(organizationId, username, id).map(toResponse)
    }
  }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("id"),
      directoryFilter.requireUserPermission("edit", "id"),
      directoryFilter.requireTokenPermission("edit", "id")
    )
  ).post(s"/directories/:id/unstar") { request: Request =>
    Profiler(s"/directories/:id/unstar")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.Directory,
      resourceId = request.getLongParam("id").toString,
      description = s"remove directory ${request.getLongParam("id")} to favorite"
    ) {
      val organizationId = getOrganizationId(request.currentOrganizationId)
      val username = request.currentUsername
      val id = request.getLongParam("id")
      starredDirectoryService.unstar(organizationId, username, id).map(toResponse)
    }
  }

  filter[MustLoggedInFilter]
    .post(s"/directories/recent") { request: ListDirectoriesRequest =>
      Profiler(s"/directories/recent") {
        val organizationId = getOrganizationId(request.currentOrganizationId)
        val username = request.currentUsername
        for {
          directories <- recentDirectoryService.list(organizationId, username, request.from, request.size)
          directoryResponses <- enhanceWithUserProfile(organizationId, directories)
          response <- enhanceWithStarDirs(organizationId, username, directoryResponses)
        } yield response
      }
    }

  filter[MustLoggedInFilter]
    .post(s"/directories/star") { request: ListDirectoriesRequest =>
      Profiler(s"/directories/star") {
        val organizationId = getOrganizationId(request.currentOrganizationId)
        val username = request.currentUsername
        for {
          directories <- starredDirectoryService.list(organizationId, username, request.from, request.size)
          directoryResponses <- enhanceWithUserProfile(organizationId, directories)
        } yield directoryResponses.map(_.copy(isStarred = true))
      }
    }

  filter[MustLoggedInFilter]
    .post(s"/directories/trash") { request: ListDirectoriesRequest =>
      Profiler(s"/directories/trash") {
        val organizationId: Long = getOrganizationId(request.currentOrganizationId)
        val username: String = request.currentUsername
        for {
          directories <- deletedDirectoryService.listRootDirectories(request.copy(ownerId = Some(username)))
          directoryResponses <- enhanceWithUserProfile(organizationId, directories)
          response <- enhanceWithStarDirs(organizationId, username, directoryResponses)
        } yield response
      }
    }

  filter[MustLoggedInFilter]
    .filter(
      OrFilter(
        directoryFilter.requireDirectoryOwner("id"),
        directoryFilter.requireUserPermission("view", "id"),
        directoryFilter.requireTokenPermission("view", "id")
      )
    )
    .post(s"/directories/trash/:id") { request: ListDirectoriesRequest =>
      Profiler(s"/directories/trash/:id") {
        val parentId: DirectoryId = request.request.getLongParam("id")
        val organizationId: Long = getOrganizationId(request.currentOrganizationId)
        val username: String = request.currentUsername
        for {
          directories <- deletedDirectoryService.listDirectories(
            request.copy(parentId = Some(parentId), ownerId = Some(username))
          )
          directoryResponses <- enhanceWithUserProfile(organizationId, directories)
          response <- enhanceWithStarDirs(organizationId, username, directoryResponses)
        } yield response
      }
    }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.requireAll("user:delete:[username]", LicensePermission.EditData))
    .delete(s"/user-data/:username") { request: DeleteUserDataRequest =>
      Profiler(s"/user-data/:username")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.User,
        resourceId = request.username,
        description = s"delete user ${request.username}"
      ) {
        adminService.delete(request).map(toResponse)
      }
    }

  private def toResponse(success: Boolean): Map[String, Any] = {
    Map("success" -> success)
  }

  private def getUserProfile(request: Request): UserProfile = {
    request.currentProfile match {
      case Some(x) => x
      case None    => throw NotFoundError(s"fail to find profile of user with id ${request.currentUser.username}")
    }
  }

  private def enhanceWithUserProfile(
      organizationId: Long,
      directories: Array[Directory]
  ): Future[Array[DirectoryResponse]] = {
    val ownerIds: Array[UserId] = directories.map(dir => dir.ownerId).distinct
    for {
      userProfilesAsMap <- profileService.getUserProfiles(organizationId, ownerIds)
    } yield {
      directories.map(dir => {
        val userProfile: Option[ShortUserProfile] = userProfilesAsMap.get(dir.ownerId).map(_.toShortUserProfile)
        toDirectoryResponse(dir, userProfile)
      })
    }
  }

  private def toDirectoryResponse(dir: Directory, user: Option[ShortUserProfile]): DirectoryResponse = {
    DirectoryResponse(
      id = dir.id,
      name = dir.name,
      owner = user,
      createdDate = dir.createdDate,
      parentId = dir.parentId,
      isRemoved = dir.isRemoved,
      directoryType = dir.directoryType,
      dashboardId = dir.dashboardId,
      updatedDate = dir.updatedDate,
      data = dir.data
    )
  }

  private def getOrganizationId(organizationId: Option[Long]): Long = {
    organizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }
  }

  private def enhanceWithStarDirs(
      organizationId: DirectoryId,
      username: String,
      directoryResponses: Array[DirectoryResponse]
  ): Future[Array[DirectoryResponse]] = {
    for {
      total <- starredDirectoryService.count(organizationId, username)
      starredDirectoryIds <- starredDirectoryService.list(organizationId, username, 0, total)
      response <- enhanceStar(directoryResponses, starredDirectoryIds.map(_.id))
    } yield response
  }

  private def enhanceStar(
      directoryResponses: Array[DirectoryResponse],
      starredDirectoryIds: Array[DirectoryId]
  ): Future[Array[DirectoryResponse]] =
    Future {
      directoryResponses.map(directory => {
        if (starredDirectoryIds.contains(directory.id))
          directory.copy(isStarred = true)
        else
          directory
      })
    }
}
