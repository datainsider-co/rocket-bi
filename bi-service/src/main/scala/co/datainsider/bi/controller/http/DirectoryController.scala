package co.datainsider.bi.controller.http

import co.datainsider.bi.controller.http.filter.UserActivityTracker
import co.datainsider.bi.domain.Directory
import co.datainsider.bi.domain.Directory.{MyData, Shared}
import co.datainsider.bi.domain.Ids.{DirectoryId, UserId}
import co.datainsider.bi.domain.query.event.{ActionType, ResourceType}
import co.datainsider.bi.domain.request._
import co.datainsider.bi.domain.response.{DirectoryResponse, ParentDirectoriesResponse}
import co.datainsider.bi.service.{
  DeletedDirectoryService,
  DirectoryService,
  RecentDirectoryService,
  StarredDirectoryService
}
import datainsider.profiler.Profiler
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.util.Future
import datainsider.authorization.filters.DirectoryAccessFilters
import datainsider.client.domain.ThriftImplicit.RichUserProfileLike
import datainsider.client.domain.user.{ShortUserProfile, UserProfile}
import datainsider.client.exception.{BadRequestError, NotFoundError, UnAuthorizedError, UnsupportedError}
import datainsider.client.filter.MustLoggedInFilter
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.service.ProfileClientService

import scala.concurrent.ExecutionContext.Implicits.global

class DirectoryController @Inject() (
    directoryService: DirectoryService,
    profileService: ProfileClientService,
    deletedDirectoryService: DeletedDirectoryService,
    starredDirectoryService: StarredDirectoryService,
    recentDirectoryService: RecentDirectoryService
) extends Controller {

  filter[DirectoryAccessFilters.ViewAccessFilter]
    .get(s"/directories/:id") { request: GetDirectoryRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::GetDirectoryRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"view directory ${request.id}"
      ) {
        val user: UserProfile = getUserProfile(request.request)
        val directoryResponse: Future[DirectoryResponse] =
          directoryService.get(request).map(toDirectoryResponse(_, Some(user.toShortUserProfile)))
        directoryResponse
      }
    }

  filter[MustLoggedInFilter]
    .get(s"/directories/root") { request: GetRootDirectoryRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::GetRootDirectoryRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"get root directory of user ${request.currentUsername}"
      ) {
        val user: UserProfile = getUserProfile(request.request)
        val directoryResponse: Future[DirectoryResponse] =
          directoryService.getRootDir(request).map(toDirectoryResponse(_, Some(user.toShortUserProfile)))
        directoryResponse
      }
    }

  filter[DirectoryAccessFilters.ViewAccessFilter]
    .post(s"/directories/:id/list") { request: ListDirectoriesRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::ListDirectoriesRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"browse directory ${request.request.getLongParam("id")}"
      ) {
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

  filter[DirectoryAccessFilters.ViewAccessFilter]
    .post(s"/directories/:id/list/shared") { request: ListDirectoriesRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/:id/list/shared")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"browse shared directory ${request.request.getLongParam("id")}"
      ) {
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

  private def listSharedRootDirectories(request: ListDirectoriesRequest): Future[Array[DirectoryResponse]] =
    Profiler(s"[Http] ${this.getClass.getSimpleName}::listSharedRootDirectories") {
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
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/quick_list")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"quick list directory"
      ) {
        directoryService.quickList(request)
      }
    }

  private def listMyDataDirectory(request: ListDirectoriesRequest): Future[Array[DirectoryResponse]] =
    Profiler(s"[Http] ${this.getClass.getSimpleName}::listMyDataDirectory") {
      for {
        sharedDirectoryResponses <- listSharedRootDirectories(request)
        rootId: DirectoryId <- getRootId(request.request)
        directoryResponses: Array[DirectoryResponse] <- list(
          request.copy(parentId = Some(rootId), isRemoved = Some(false))
        )
      } yield directoryResponses.union(sharedDirectoryResponses).distinct
    }

  private def getRootId(request: Request): Future[DirectoryId] =
    Profiler(s"[Http] ${this.getClass.getSimpleName}::getRootId") {
      directoryService.getRootDir(GetRootDirectoryRequest(request)).map(_.id)
    }

  private def list(listDirectoriesRequest: ListDirectoriesRequest): Future[Array[DirectoryResponse]] =
    Profiler(s"[Http] ${this.getClass.getSimpleName}::list") {
      val organizationId = getOrganizationId(listDirectoriesRequest.currentOrganizationId)
      val username = listDirectoriesRequest.currentUsername
      for {
        directories: Array[Directory] <- directoryService.list(listDirectoriesRequest)
        directoryResponses: Array[DirectoryResponse] <- enhanceWithUserProfile(organizationId, directories)
        response <- enhanceWithStarDirs(organizationId, username, directoryResponses)
      } yield response
    }

  filter[MustLoggedInFilter]
    .filter[DirectoryAccessFilters.CreateAccessFilter]
    .post(s"/directories/create") { request: CreateDirectoryRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::CreateDirectoryRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Directory,
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

  filter[DirectoryAccessFilters.EditAccessFilter]
    .put(s"/directories/:id/rename") { request: RenameDirectoryRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::RenameDirectoryRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Directory,
        description = s"rename directory to '${request.toName}'"
      ) {
        directoryService.rename(request).map(toResponse)
      }
    }

  filter[DirectoryAccessFilters.EditAccessFilter]
    .put(s"/directories/:id/move") { request: MoveDirectoryRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::MoveDirectoryRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Directory,
        description = s"move directory ${request.id} into directory ${request.toParentId}"
      ) {
        directoryService.move(request).map(toResponse)
      }
    }

  filter[MustLoggedInFilter]
    .post(s"/directories/removed/list") { request: ListDirectoriesRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::ListDirectoriesRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"view removed directories"
      ) {
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
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/shared/list")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"view shared directory"
      ) {
        val directoryResponses: Future[Array[DirectoryResponse]] = listShared(request)
        directoryResponses
      }
    }

  @deprecated
  private def listShared(request: ListDirectoriesRequest): Future[Array[DirectoryResponse]] =
    Profiler(s"[Http] ${this.getClass.getSimpleName}::listShared") {
      val userId: String = request.currentUser.username
      val organizationId = getOrganizationId(request.currentOrganizationId)
      for {
        directories: Array[Directory] <- directoryService.listShared(request.copy(isRemoved = Some(false)))
        directoryResponses: Array[DirectoryResponse] <- enhanceWithUserProfile(organizationId, directories)
        response <- enhanceWithStarDirs(organizationId, userId, directoryResponses)
      } yield response
    }

  private def listSharedDirs(request: ListDirectoriesRequest): Future[Array[DirectoryResponse]] =
    Profiler(s"[Http] ${this.getClass.getSimpleName}::listSharedDirs") {
      val username: String = request.currentUser.username
      val organizationId = getOrganizationId(request.currentOrganizationId)
      for {
        directories: Array[Directory] <- directoryService.listSharedDirectories(request.copy(isRemoved = Some(false)))
        directoryResponses: Array[DirectoryResponse] <- enhanceWithUserProfile(organizationId, directories)
        response <- enhanceWithStarDirs(organizationId, username, directoryResponses)
      } yield response
    }

  filter[DirectoryAccessFilters.ViewAccessFilter]
    .get(s"/directories/:id/parents") { request: GetDirectoryRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/:id/parents")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"list parent directories of directory ${request.id}"
      ) {
        request.id match {
          case MyData =>
            for {
              parentId: DirectoryId <- getRootId(request.request)
              directoriesResponse: ParentDirectoriesResponse <-
                directoryService.listParents(request.copy(id = parentId))
            } yield directoriesResponse
          case Shared                            => directoryService.listParentsShared(request)
          case directoryId if (directoryId > 0L) => directoryService.listParents(request)
          case _                                 => Future.exception(BadRequestError("Directory id invalid"))
        }
      }
    }

  filter[DirectoryAccessFilters.DeleteAccessFilter]
    .delete(s"/directories/:id") { request: DeleteDirectoryRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::DeleteDirectoryRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Directory,
        description = s"delete directory ${request.id}"
      ) {
        directoryService.delete(request).map(toResponse)
      }
    }

  filter[DirectoryAccessFilters.DeleteAccessFilter]
    .put(s"/directories/:id/remove") { request: DeleteDirectoryRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/:id/remove")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Directory,
        description = s"remove directory ${request.id}"
      ) {
        val orgId: Long = request.currentOrganizationId.get
        for {
          _ <- recentDirectoryService.delete(orgId, request.id)
          response <- directoryService.remove(request).map(toResponse)
        } yield response
      }
    }

  filter[DirectoryAccessFilters.DeleteAccessFilter]
    .put(s"/directories/:id/restore") { request: DeleteDirectoryRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/:id/restore")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Directory,
        description = s"restore directory ${request.id}"
      ) {
        deletedDirectoryService.restore(request).map(toResponse)
      }
    }

  filter[DirectoryAccessFilters.DeleteAccessFilter]
    .delete(s"/directories/trash/:id/delete") { request: DeleteDirectoryRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/trash/:id/delete")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Directory,
        description = s"delete directory ${request.id} forever"
      ) {
        deletedDirectoryService.permanentDeleteDirectory(request).map(toResponse)
      }
    }

  filter[DirectoryAccessFilters.ViewAccessFilter]
    .post(s"/directories/:id/star") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/:id/star")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Directory,
        description = s"add directory ${request.getLongParam("id")} to favorite"
      ) {
        val organizationId = getOrganizationId(request.currentOrganizationId)
        val username = request.currentUsername
        val id = request.getLongParam("id")
        starredDirectoryService.star(organizationId, username, id).map(toResponse)
      }
    }

  filter[DirectoryAccessFilters.ViewAccessFilter]
    .post(s"/directories/:id/unstar") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/:id/unstar")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Directory,
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
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/recent")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Directory,
        description = s"view recent directories"
      ) {
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
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/star")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"view favorite directories"
      ) {
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
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/trash")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"view removed directories"
      ) {
        val organizationId: Long = getOrganizationId(request.currentOrganizationId)
        val username: String = request.currentUsername
        for {
          directories <- deletedDirectoryService.listRootDeletedDirectories(request.copy(ownerId = Some(username)))
          directoryResponses <- enhanceWithUserProfile(organizationId, directories)
          response <- enhanceWithStarDirs(organizationId, username, directoryResponses)
        } yield response
      }
    }

  filter[MustLoggedInFilter]
    .post(s"/directories/trash/:id") { request: ListDirectoriesRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/directories/trash/:id")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Directory,
        description = s"view detail removed directory ${request.request.getLongParam("id")}"
      ) {
        val parentId: DirectoryId = request.request.getLongParam("id")
        val organizationId: Long = getOrganizationId(request.currentOrganizationId)
        val username: String = request.currentUsername
        for {
          directories <- deletedDirectoryService.listDeletedDirectories(
            request.copy(parentId = Some(parentId), ownerId = Some(username))
          )
          directoryResponses <- enhanceWithUserProfile(organizationId, directories)
          response <- enhanceWithStarDirs(organizationId, username, directoryResponses)
        } yield response
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
  ): Future[Array[DirectoryResponse]] =
    Profiler(s"[Http] ${this.getClass.getSimpleName}::enhanceWithUserProfile") {
      val ownerIds: Array[UserId] = directories.map(dir => dir.ownerId).distinct
      profileService
        .getUserProfiles(organizationId, ownerIds)
        .map(profileMap => {
          directories.map(dir => {
            profileMap.get(dir.ownerId) match {
              case Some(userProfile) => toDirectoryResponse(dir, Some(userProfile.toShortUserProfile))
              case _                 => throw NotFoundError(s"fail to find profile of user with id ${dir.ownerId}")
            }
          })
        })
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
      updatedDate = dir.updatedDate
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
