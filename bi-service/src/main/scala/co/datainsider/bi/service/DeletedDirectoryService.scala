package co.datainsider.bi.service

import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain.request.{DeleteDirectoryRequest, ListDirectoriesRequest}
import co.datainsider.bi.domain.{Directory, DirectoryType}
import co.datainsider.bi.repository.{DashboardRepository, DeletedDirectoryRepository, DirectoryRepository}
import co.datainsider.share.controller.request.{GetResourceSharingInfoRequest, RevokeShareRequest}
import co.datainsider.share.service.ShareService
import com.google.inject.Inject
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.exception.{NotFoundError, UnAuthorizedError}

import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

trait DeletedDirectoryService {
  def listRootDeletedDirectories(request: ListDirectoriesRequest): Future[Array[Directory]]

  def listDeletedDirectories(request: ListDirectoriesRequest): Future[Array[Directory]]

  def permanentDeleteDirectory(request: DeleteDirectoryRequest): Future[Boolean]

  def restore(request: DeleteDirectoryRequest): Future[Boolean]

  def getDeletedDirectory(directoryId: DirectoryId): Future[Directory]
}

class DeletedDirectoryServiceImpl @Inject() (
    directoryRepository: DirectoryRepository,
    dashboardRepository: DashboardRepository,
    deletedDirectoryRepository: DeletedDirectoryRepository,
    starredDirectoryService: StarredDirectoryService,
    shareService: ShareService
) extends DeletedDirectoryService
    with Logging {

  override def listRootDeletedDirectories(request: ListDirectoriesRequest): Future[Array[Directory]] = {
    for {
      directories <- deletedDirectoryRepository.list(request)
      rootDirectories <- filterRootDirectories(directories)
    } yield rootDirectories
  }

  override def listDeletedDirectories(request: ListDirectoriesRequest): Future[Array[Directory]] = {
    deletedDirectoryRepository.list(request)
  }

  override def permanentDeleteDirectory(request: DeleteDirectoryRequest): Future[Boolean] = {
    val organizationId = request.currentOrganizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }
    getDeletedDirectory(request.id)
      .map(targetDir => {
        val directories: (Array[Directory], Array[DirectoryId]) = getInnerDeletedDirectories(targetDir)
        val deletedOps: Array[Future[Boolean]] = directories._1.map(dir => {
          dir.directoryType match {
            case DirectoryType.Directory =>
              for {
                usernames <-
                  shareService
                    .getAllInfo(organizationId, request.id.toString, DirectoryType.Directory.toString)
                    .map(_.map(_.user.username))
                _ <- shareService.revoke(
                  organizationId,
                  RevokeShareRequest(DirectoryType.Directory.toString, request.id.toString, usernames, request.request)
                )
                isDeleted <- deletedDirectoryRepository.delete(dir.id)
                isRemoveStar <- starredDirectoryService.unstar(organizationId, request.currentUsername, dir.id)
              } yield isDeleted && isRemoveStar
            case DirectoryType.Dashboard | DirectoryType.Queries =>
              for {
                usernames <-
                  shareService
                    .getAllInfo(organizationId, request.id.toString, DirectoryType.Directory.toString)
                    .map(_.map(_.user.username))
                _ <- shareService.revoke(
                  organizationId,
                  RevokeShareRequest(DirectoryType.Directory.toString, request.id.toString, usernames, request.request)
                )
                okDir <- deletedDirectoryRepository.delete(dir.id)
                okDash <- dashboardRepository.delete(dir.dashboardId.get)
                isRemoveStar <- starredDirectoryService.unstar(organizationId, request.currentUsername, dir.id)
              } yield okDir && okDash && isRemoveStar
          }
        })
        Future.collect(deletedOps).map(_.reduce(_ && _))
      })
      .flatten
  }

  override def restore(request: DeleteDirectoryRequest): Future[Boolean] = {
    getDeletedDirectory(request.id)
      .map(targetDir => {
        val directories: (Array[Directory], Array[DirectoryId]) = getInnerDeletedDirectories(targetDir)
        val restoreOps: Array[Future[Boolean]] = directories._1.map(dir => {
          dir.directoryType match {
            case DirectoryType.Directory =>
              for {
                isRestore <- directoryRepository.restore(dir)
                isDeleted <- deletedDirectoryRepository.delete(dir.id)
              } yield isRestore && isDeleted
            case DirectoryType.Dashboard | DirectoryType.Queries =>
              for {
                isRestoreDir <- directoryRepository.restore(dir)
                okDir <- deletedDirectoryRepository.delete(dir.id)
              } yield okDir && isRestoreDir
          }
        })
        restoreParentIfExist(targetDir)
        Future.collect(restoreOps).map(_.reduce(_ && _))
      })
      .flatten
  }

  private def filterRootDirectories(directories: Array[Directory]): Future[Array[Directory]] =
    Future {
      val directoryIds: Array[DirectoryId] = directories.map(_.id)
      directories.filterNot(directory => directoryIds.contains(directory.parentId))
    }

  override def getDeletedDirectory(directoryId: DirectoryId): Future[Directory] = {
    deletedDirectoryRepository.get(directoryId).map {
      case Some(value) => value
      case None        => throw NotFoundError(s"no directory is found for id $directoryId")
    }
  }

  private def getInnerDeletedDirectories(directory: Directory): (Array[Directory], Array[DirectoryId]) = {
    val queue = mutable.Queue[Directory](directory)
    val directories = ArrayBuffer[Directory](directory)
    val parents = ArrayBuffer[DirectoryId](-1L)
    while (queue.nonEmpty) {
      val cur = queue.dequeue()
      deletedDirectoryRepository
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

  private def restoreParentIfExist(directory: Directory): Future[Boolean] = {
    deletedDirectoryRepository
      .isExist(directory.parentId)
      .map {
        case true =>
          for {
            parentDirectory <- getDeletedDirectory(directory.parentId)
            isOk <- directoryRepository.restore(parentDirectory)
            _ <- restoreParentIfExist(parentDirectory)
          } yield isOk
        case false => Future.False
      }
      .flatten
  }
}
