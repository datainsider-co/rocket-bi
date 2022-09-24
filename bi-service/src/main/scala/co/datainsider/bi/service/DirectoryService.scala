package co.datainsider.bi.service

import co.datainsider.bi.domain.Directory.{Shared, getSharedDirectory}
import co.datainsider.bi.domain.Ids.{DashboardId, DirectoryId, OrganizationId, UserId}
import co.datainsider.bi.domain.request._
import co.datainsider.bi.domain.response.{PaginationResponse, ParentDirectoriesResponse}
import co.datainsider.bi.domain.{Directory, DirectoryType}
import co.datainsider.bi.repository.{DashboardRepository, DeletedDirectoryRepository, DirectoryRepository}
import co.datainsider.bi.util.Implicits._
import co.datainsider.bi.util.ZConfig
import co.datainsider.share.service.{DirectoryPermissionAssigner, DirectoryPermissionService, ShareService}
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.user.UserProfile
import datainsider.client.exception.{BadRequestError, InternalError, NotFoundError}
import datainsider.client.service.ProfileClientService
import education.x.commons.SsdbKVS

import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global

trait DirectoryService {
  def get(request: GetDirectoryRequest): Future[Directory]

  def get(orgId: Long, dirId: Long): Future[Directory]

  def create(request: CreateDirectoryRequest): Future[Directory]

  def getRootDir(request: GetRootDirectoryRequest): Future[Directory]

  def list(request: ListDirectoriesRequest): Future[Array[Directory]]

  def quickList(request: ListDirectoriesRequest): Future[PaginationResponse[Directory]]

  def listShared(request: ListDirectoriesRequest): Future[Array[Directory]]

  def listSharedDirectories(request: ListDirectoriesRequest): Future[Array[Directory]]

  def listSharedRoot(request: ListDirectoriesRequest): Future[Array[Directory]]

  def listParents(request: GetDirectoryRequest): Future[ParentDirectoriesResponse]

  def listParentsShared(request: GetDirectoryRequest): Future[ParentDirectoriesResponse]

  def rename(request: RenameDirectoryRequest): Future[Boolean]

  def move(request: MoveDirectoryRequest): Future[Boolean]

  def delete(request: DeleteDirectoryRequest): Future[Boolean]

  def remove(request: DeleteDirectoryRequest): Future[Boolean]

  def migrateUserData(from: UserId, to: UserId): Future[Boolean]

  def deleteUserData(userId: UserId): Future[Boolean]

  def getOwner(organizationId: Long, directoryId: DirectoryId): Future[UserProfile]

  def isOwner(orgId: Long, directoryId: DirectoryId, username: String): Future[Boolean]

  def listParentIds(id: DirectoryId): Future[Array[DirectoryId]]

  def listParentIdsByDashboardId(id: DashboardId): Future[Array[DirectoryId]]

  def listChildrenIds(id: DirectoryId): Future[Seq[DirectoryId]]

  // Used by dashboard and directory
  def updateUpdatedDate(id: DirectoryId): Future[Boolean]

}

class DirectoryServiceImpl @Inject() (
    directoryRepository: DirectoryRepository,
    dashboardRepository: DashboardRepository,
    profileService: ProfileClientService,
    shareService: ShareService,
    @Named("root_dir") rootDirKvs: SsdbKVS[String, Long],
    deletedDirectoryRepository: DeletedDirectoryRepository,
    directoryPermissionAssigner: DirectoryPermissionAssigner
) extends DirectoryService
    with Logging {

  override def get(request: GetDirectoryRequest): Future[Directory] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    get(orgId, request.id)
  }

  override def getRootDir(request: GetRootDirectoryRequest): Future[Directory] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    val userId = request.currentUser.username
    for {
      id <- getOrCreateRootDir(request.currentOrganizationId.get, userId)
      directory <- get(orgId, id)
    } yield directory
  }

  override def create(request: CreateDirectoryRequest): Future[Directory] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    for {
      parentDir <- get(orgId, request.parentId)
      createdId <- directoryRepository.create(request, parentDir.ownerId, request.currentUser.username)
      _ <- shareService.copyPermissionFromParent(
        request.currentOrganizationId.get,
        createdId.toString,
        request.parentId.toString,
        DirectoryType.Directory.toString,
        request.currentUser.username,
        parentDir.ownerId
      )
      directory <- get(orgId, createdId)
    } yield directory
  }

  override def list(request: ListDirectoriesRequest): Future[Array[Directory]] = {
    directoryRepository.list(request)
  }

  override def quickList(request: ListDirectoriesRequest): Future[PaginationResponse[Directory]] = {
    for {
      directories <- directoryRepository.list(request.copy(ownerId = Some(request.currentUser.username)))
      dirCount <- directoryRepository.count(request)
    } yield PaginationResponse(data = directories, total = dirCount)
  }

  private def listSharedDirs(request: ListDirectoriesRequest): Future[Array[Directory]] = {
    for {
      directoryIds <-
        shareService
          .listResourceIdSharing(
            request.currentOrganizationId.get,
            DirectoryType.Directory.toString,
            request.currentUsername,
            Some(request.from),
            Some(request.size)
          )
          .map(_.data.map(_.toLong).toArray)
      directories <- directoryRepository.list(directoryIds)
    } yield directories
  }

  def listDashboardSharedAsDirectories(request: ListDirectoriesRequest): Future[Array[Directory]] = {
    for {
      dashboardIds <-
        shareService
          .listResourceIdSharing(
            request.currentOrganizationId.get,
            DirectoryType.Dashboard.toString,
            request.currentUsername,
            Some(request.from),
            Some(request.size)
          )
          .map(_.data.map(_.toLong).toArray)
      directories <- directoryRepository.listByDashboardIds(dashboardIds)
    } yield directories
  }

  override def listShared(request: ListDirectoriesRequest): Future[Array[Directory]] = {
    // TODO: fix paging here
    for {
      directories <- listSharedDirs(request)
      directories2 <- listDashboardSharedAsDirectories(request)
    } yield (directories ++ directories2)
  }

  override def listParents(request: GetDirectoryRequest): Future[ParentDirectoriesResponse] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)
    val maxDepth = ZConfig.getInt("directory.parent_depth")
    val userId = request.currentUser.username
    for {
      rootId <- getOrCreateRootDir(request.currentOrganizationId.get, userId)
      rootDir <- get(orgId, rootId)
      parents = getParentDirectories(request.id, Some(maxDepth))
      isAll = parents.contains(rootDir)
    } yield ParentDirectoriesResponse(rootDir, isAll, parents)
  }

  private def getParentIdSharedFromRoot(
      parentIds: Array[DirectoryId],
      idsShared: Map[String, Boolean],
      maxDepth: Int = 4
  ): (Boolean, Seq[DirectoryId]) = {
    val ids = parentIds.dropWhile(id => !idsShared.getOrElse(id.toString, false))
    if (ids.length > maxDepth) {
      (false, ids.slice(ids.length - maxDepth, ids.length))
    } else {
      (true, ids)
    }
  }

  private def getDirectories(directoryIds: Seq[DirectoryId]): Future[Array[Directory]] = {
    directoryRepository.list(directoryIds.toArray)
  }

  private def listParentsShared(
      request: GetDirectoryRequest,
      rootDir: Directory,
      maxDepth: Int
  ): Future[ParentDirectoriesResponse] = {
    val username = request.currentUser.username
    for {
      parentIds <- listParentIds(request.id)
      resourceIds = parentIds.map(_.toString)
      idsShared <- shareService.isShared(
        request.currentOrganizationId.get,
        DirectoryType.Directory.toString,
        resourceIds,
        username
      )
      (isAll, parentIdsShared) = getParentIdSharedFromRoot(parentIds, idsShared, maxDepth)
      parents <- getDirectories(parentIdsShared)
    } yield {
      ParentDirectoriesResponse(rootDir, isAll, Array(rootDir) ++ parents)
    }
  }

  override def listParentsShared(request: GetDirectoryRequest): Future[ParentDirectoriesResponse] = {
    val username = request.currentUser.username
    val maxDepth = ZConfig.getInt("directory.parent_depth")
    val rootDir = getSharedDirectory(username)

    request.id match {
      case id if (id >= 0) => listParentsShared(request, rootDir, maxDepth)
      case Shared          => Future.value(ParentDirectoriesResponse(rootDir, true, Array(rootDir)))
      case _               => Future.exception(InternalError(s"can not list parents of id ${request.id}"))
    }

  }

  override def delete(request: DeleteDirectoryRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    get(orgId, request.id)
      .map(targetDir => {
        val directories = getInnerDirectories(targetDir)
        val deleteOps = directories._1.map(dir => {
          // TODO: remove share when remove direction
          dir.directoryType match {
            case DirectoryType.Directory =>
              directoryRepository.delete(dir.id)
            case DirectoryType.Dashboard | DirectoryType.Queries =>
              for {
                okDir <- directoryRepository.delete(dir.id)
                okDash <- dashboardRepository.delete(dir.dashboardId.get)
              } yield okDir && okDash
          }
        })
        Future.collect(deleteOps).map(_.reduce(_ && _))
      })
      .flatten
  }

  override def rename(request: RenameDirectoryRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    get(orgId, request.id)
      .map(dir => {
        dir.directoryType match {
          case DirectoryType.Directory =>
            directoryRepository.rename(dir.id, request.toName)
          case DirectoryType.Dashboard | DirectoryType.Queries =>
            for {
              okDir <- directoryRepository.rename(dir.id, request.toName)
              okDash <- dashboardRepository.rename(dir.dashboardId.get, request.toName)
            } yield okDir && okDash
        }
      })
      .flatten
  }

  override def move(request: MoveDirectoryRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    for {
      dir <- get(orgId, request.id)
      _ <- get(orgId, request.toParentId).map(destinationDir =>
        if (!isDestinationDirValid(dir, destinationDir))
          throw BadRequestError("can not move directory to itself")
      )
      response <- directoryRepository.move(request.id, request.toParentId)
    } yield response
  }

  override def remove(request: DeleteDirectoryRequest): Future[Boolean] = {
    val orgId: Long = getOrgId(request.currentOrganizationId)

    get(orgId, request.id)
      .map(targetDir => {
        val directories: (Array[Directory], Array[DirectoryId]) = getInnerDirectories(targetDir)
        val deleteOps: Array[Future[Boolean]] = directories._1.map(dir => {
          dir.directoryType match {
            case DirectoryType.Directory =>
              for {
                addTodDeletedDb <- deletedDirectoryRepository.insert(dir)
                isDeleted <- directoryRepository.delete(dir.id)
              } yield addTodDeletedDb && isDeleted
            case DirectoryType.Dashboard | DirectoryType.Queries =>
              for {
                isRemoveDir <- deletedDirectoryRepository.insert(dir)
                okDir <- directoryRepository.delete(dir.id)
              } yield okDir && isRemoveDir
          }
        })
        Future.collect(deleteOps).map(_.reduce(_ && _))
      })
      .flatten
  }

  private def copy(fromId: DirectoryId, toId: DirectoryId): Future[Boolean] = {
    for {
      fromDir <- fetch(fromId)
      toDir <- fetch(toId)
      ok <- copyRecursion(fromDir, toDir)
    } yield ok
  }

  override def migrateUserData(fromUserId: UserId, toUserId: UserId): Future[Boolean] = {
    for {
      fromRootId <- getOrCreateRootDir(fromUserId)
      toRootId <- getOrCreateRootDir(toUserId)
      ok <- copy(fromRootId, toRootId)
    } yield ok
  }

  override def deleteUserData(userId: UserId): Future[Boolean] = {
    for {
      id <- getOrCreateRootDir(userId)
      ok <- delete(DeleteDirectoryRequest(id))
      _ <- rootDirKvs.remove(userId).asTwitterFuture
    } yield ok
  }

  private def copyRecursion(fromDir: Directory, toDir: Directory): Future[Boolean] = {
    for {
      createdId <- createCopyInstance(fromDir, toDir)
      createdDir <- fetch(createdId)
      copiedChildren <-
        directoryRepository
          .list(ListDirectoriesRequest(parentId = Some(fromDir.id)))
          .map(directories => {
            directories.map(child => copyRecursion(child, createdDir))
          })
    } yield createdId.isValidLong && !copiedChildren.contains(Future.False)
  }

  private def createCopyInstance(from: Directory, to: Directory): Future[DirectoryId] = {
    from.directoryType match {
      case DirectoryType.Directory =>
        val createReq = from.toCreateDirRequest.copy(parentId = to.id)
        directoryRepository.create(createReq, to.ownerId, to.ownerId)
      case DirectoryType.Dashboard | DirectoryType.Queries =>
        for {
          dashboardOpt <- dashboardRepository.get(from.dashboardId.get)
          createdDashboardId <- dashboardRepository.create(dashboardOpt.get.copy(ownerId = to.ownerId))
          createdDirectory <- directoryRepository.create(
            CreateDirectoryRequest(
              name = dashboardOpt.get.name,
              parentId = to.id,
              directoryType = from.directoryType,
              dashboardId = Some(createdDashboardId)
            ),
            to.ownerId,
            to.ownerId
          )
        } yield createdDirectory
    }
  }

  private def getInnerDirectoryIds(id: DirectoryId): Array[DirectoryId] = {
    val queue = mutable.Queue[DirectoryId](id)
    val ids = ArrayBuffer[DirectoryId](id)
    while (queue.nonEmpty) {
      val curId = queue.dequeue()
      directoryRepository
        .list(ListDirectoriesRequest(parentId = Some(curId)))
        .map(_.foreach(dir => {
          queue.enqueue(dir.id)
          ids += dir.id
        }))
    }
    ids.distinct.toArray
  }

  private def getInnerDirectories(directory: Directory): (Array[Directory], Array[DirectoryId]) = {
    val queue = mutable.Queue[Directory](directory)
    val directories = ArrayBuffer[Directory](directory)
    val parents = ArrayBuffer[DirectoryId](-1L)
    while (queue.nonEmpty) {
      val cur = queue.dequeue()
      directoryRepository
        .list(ListDirectoriesRequest(parentId = Some(cur.id)))
        .syncGet()
        .foreach(dir => {
          queue.enqueue(dir)
          directories += dir
          parents += dir.parentId
        })
    }
    (directories.toArray, parents.toArray)
  }

  // return order: [root, child1, child2]
  private def getParentDirectories(id: DirectoryId, maxDepth: Option[Int] = None): Array[Directory] = {
    val directories = ArrayBuffer[Directory]()
    var curId = id
    var count = 0
    var isFinish = false

    while (!isFinish) {
      directoryRepository.get(curId).map {
        case Some(x) =>
          directories += x
          count += 1
          curId = x.parentId
          if (curId == -1) isFinish = true
          maxDepth match {
            case Some(x) => if (count > x) isFinish = true
            case None    =>
          }
        case _ => isFinish = true
      }
    }

    directories.toArray.reverse
  }

  /*
   * root directory of user is stored in ssdb in key value pair: (username,dirId)
   * if user already have rootDirId => return
   * else create new directory and save to ssdb
   */
  private def getOrCreateRootDir(userId: UserId): Future[DirectoryId] = {
    rootDirKvs
      .get(userId)
      .asTwitterFuture
      .map {
        case Some(id) => Future.value(id)
        case None =>
          val createReq = CreateDirectoryRequest(
            name = s"root-$userId",
            parentId = -1
          )
          for {
            createdId <- directoryRepository.create(createReq, userId, userId)
            _ <- rootDirKvs.add(userId, createdId).asTwitterFuture
          } yield createdId
      }
      .flatten
  }

  private def getOrCreateRootDir(organizationId: OrganizationId, userId: UserId): Future[DirectoryId] = {
    rootDirKvs
      .get(userId)
      .asTwitterFuture
      .map {
        case Some(id) => Future.value(id)
        case None     => createRootDir(organizationId, userId)
      }
      .flatten
  }

  private def createRootDir(organizationId: OrganizationId, userId: UserId): Future[DirectoryId] = {
    val createReq = CreateDirectoryRequest(
      name = s"root-$userId",
      parentId = -1
    )
    for {
      createdId <- directoryRepository.create(createReq, userId, userId)
      _ <- rootDirKvs.add(userId, createdId).asTwitterFuture
      _ <- directoryPermissionAssigner.assign(organizationId, createdId.toString, Map(userId -> Seq("*")))
    } yield createdId
  }

  private def isDestinationDirValid(toBeMovedDir: Directory, toParentDir: Directory): Boolean = {
    val innerDirIds = getInnerDirectoryIds(toBeMovedDir.id)
    !innerDirIds.contains(toParentDir.id)
  }

  @deprecated("use fetch with org if possible")
  private def fetch(id: DirectoryId): Future[Directory] = {
    directoryRepository.get(id).map {
      case Some(x) => x
      case None    => throw NotFoundError(s"no directory is found for id $id")
    }
  }

  override def get(orgId: Long, dirId: DirectoryId): Future[Directory] = {
    for {
      dir <- directoryRepository.get(dirId).map {
        case Some(x) => x
        case None    => throw NotFoundError(s"no directory is found for id $dirId")
      }
      checkOrg <- profileService.getUserProfile(orgId, dir.ownerId).map {
        case Some(user) =>
        case None       => throw NotFoundError(s"this directory does not belongs to your organization")
      }
    } yield dir
  }

  override def getOwner(organizationId: Long, directoryId: DirectoryId): Future[UserProfile] = {
    for {
      directory <- get(organizationId, directoryId)
      maybeUserProfile <- profileService.getUserProfile(organizationId, directory.ownerId)
    } yield {
      maybeUserProfile match {
        case Some(ownerProfile) => ownerProfile
        case _                  => throw NotFoundError("fail to load profile of owner")
      }
    }
  }

  override def isOwner(orgId: Long, directoryId: DirectoryId, username: String): Future[Boolean] = {
    for {
      directory <- get(orgId, directoryId)
    } yield username.equals(directory.ownerId)
  }

  // NOTE: [root, child1, child2]
  override def listParentIds(id: DirectoryId): Future[Array[DirectoryId]] =
    Future {
      getParentDirectories(id, None).map(_.id)
    }

  override def listParentIdsByDashboardId(id: DashboardId): Future[Array[DirectoryId]] = {
    list(ListDirectoriesRequest(dashboardId = Some(id)))
      .map(_.headOption.map(_.id))
      .flatMap {
        case Some(directoryId) => listParentIds(directoryId)
        case _                 => Future.value(Array.empty)
      }
  }

  override def listChildrenIds(id: DirectoryId): Future[Seq[DirectoryId]] =
    Future {
      getInnerDirectoryIds(id).filterNot(_.equals(id))
    }

  override def listSharedRoot(request: ListDirectoriesRequest): Future[Array[Directory]] = {
    for {
      directoryIds <-
        shareService
          .listSharedRootIds(
            request.currentOrganizationId.get,
            DirectoryType.Directory.toString,
            request.currentUsername,
            Some(request.from),
            Some(request.size)
          )
          .map(_.data.map(_.toLong).toArray)
      directories <- directoryRepository.list(directoryIds)
    } yield directories
  }

  override def listSharedDirectories(request: ListDirectoriesRequest): Future[Array[Directory]] = {
    for {
      directories <- list(request)
      sharedDirectoryIds <-
        shareService
          .isShared(
            request.currentOrganizationId.get,
            DirectoryType.Directory.toString,
            directories.map(_.id.toString),
            request.currentUsername
          )
          .map(_.filter(_._2.equals(true)).keys.toArray)
      sharedDirectory <- directoryRepository.list(sharedDirectoryIds.map(_.toLong))
    } yield sharedDirectory
  }

  override def updateUpdatedDate(id: DirectoryId): Future[Boolean] = {
    for {
      parentIds <- listParentIds(id)
      isOk <- directoryRepository.refreshUpdatedDate(parentIds)
    } yield isOk
  }

  private def getOrgId(orgId: Option[Long]): Long = {
    orgId match {
      case Some(id) => id
      case None     => throw BadRequestError("Your request has not been authorized.")
    }
  }

}
