package co.datainsider.bi.service

import co.datainsider.bi.domain.Ids.{DirectoryId, OrganizationId, UserId}
import co.datainsider.bi.domain.request.ListDirectoriesRequest
import co.datainsider.bi.domain.{Directory, DirectoryType}
import co.datainsider.bi.repository.{DashboardRepository, DeletedDirectoryRepository, DirectoryRepository}
import co.datainsider.share.service.Permissions.getAvailablePermissions
import co.datainsider.share.service.ShareService
import com.google.inject.Inject
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.NotFoundError
import datainsider.client.service.OrgAuthorizationClientService

trait DeletedDirectoryService {
  def listRootDirectories(request: ListDirectoriesRequest): Future[Array[Directory]]

  def listDirectories(request: ListDirectoriesRequest): Future[Array[Directory]]

  def permanentDeleteDirectory(organizationId: OrganizationId, dirId: DirectoryId): Future[Boolean]

  def restore(organizationId: OrganizationId, dirId: DirectoryId): Future[Boolean]

  def getDirectory(organizationId: OrganizationId, directoryId: DirectoryId): Future[Directory]

  def multiAdd(organizationId: OrganizationId, directories: Seq[Directory]): Future[Boolean]

  def isOwner(organizationId: OrganizationId, directoryId: DirectoryId, userId: UserId): Future[Boolean]
}

class DeletedDirectoryServiceImpl @Inject() (
    directoryRepository: DirectoryRepository,
    dashboardRepository: DashboardRepository,
    trashDirectoryRepository: DeletedDirectoryRepository,
    starredDirectoryService: StarredDirectoryService,
    shareService: ShareService,
    orgAuthorizationClient: OrgAuthorizationClientService
) extends DeletedDirectoryService
    with Logging {

  override def listRootDirectories(request: ListDirectoriesRequest): Future[Array[Directory]] = {
    for {
      directories <- trashDirectoryRepository.list(request)
      rootDirectories <- filterRootDirectories(directories)
    } yield rootDirectories
  }

  override def listDirectories(request: ListDirectoriesRequest): Future[Array[Directory]] = {
    trashDirectoryRepository.list(request)
  }

  override def permanentDeleteDirectory(organizationId: OrganizationId, dirId: DirectoryId): Future[Boolean] = {
    for {
      directory <- getDirectory(organizationId, dirId)
      subDirectories <- trashDirectoryRepository.getSubDirectories(dirId)
      allDirectories = Seq(directory) ++ subDirectories
      isDeleteShareInfos <- deleteShareInfos(organizationId, allDirectories)
      isDeletedStar <- starredDirectoryService.deleteByUsername(organizationId, directory.ownerId)
      isDeletedDir <- trashDirectoryRepository.multiDelete(allDirectories.map(_.id))
      isDeletedDashboard <- dashboardRepository.multiDelete(getDashboardIds(allDirectories))
      _ <- removeOwnerPermissions(organizationId, allDirectories, directory.ownerId)
    } yield {
      isDeleteShareInfos || isDeletedStar || isDeletedDir || isDeletedDashboard
    }
  }

  private def getDashboardIds(directories: Seq[Directory]): Array[DirectoryId] = {
    directories
      .filter(dashboard =>
        dashboard.directoryType == DirectoryType.Dashboard || dashboard.directoryType == DirectoryType.Queries
      )
      .filter(_.dashboardId.isDefined)
      .map(_.dashboardId.get)
      .toArray
  }

  private def removeOwnerPermissions(
      organizationId: OrganizationId,
      directories: Seq[Directory],
      ownerId: UserId
  ): Future[Unit] = {
    val permissions = directories
      .map(_.id)
      .flatMap(id => {
        getAvailablePermissions(organizationId, DirectoryType.Directory.toString, id.toString)
      })
    orgAuthorizationClient
      .removePermissions(organizationId, ownerId, permissions)
      .unit
      .rescue {
        case ex: Throwable =>
          logger.error(s"Failed to remove permissions for user $ownerId", ex)
          Future.Unit
      }
  }

  private def deleteShareInfos(organizationId: OrganizationId, directories: Seq[Directory]): Future[Boolean] = {
    val results: Seq[Future[Boolean]] = directories.map(directory => deleteShareInfo(organizationId, directory.id))
    Future.collect(results).map(_.forall(identity))
  }

  private def deleteShareInfo(organizationId: OrganizationId, dirId: DirectoryId): Future[Boolean] = {
    val isRemoved = for {
      usernames <-
        shareService
          .getAllInfo(organizationId, dirId.toString, DirectoryType.Directory.toString)
          .map(_.map(_.user.username))
      _ <- shareService.revoke(
        organizationId,
        DirectoryType.Directory.toString,
        dirId.toString,
        usernames
      )
      _ <- shareService.revokeShareAnyone(
        organizationId,
        DirectoryType.Directory.toString,
        dirId.toString
      )
    } yield true
    isRemoved.rescue {
      case ex: Throwable => {
        logger.error("Error when remove share info", ex)
        Future.False
      };
    }
  }

  override def restore(organizationId: OrganizationId, dirId: DirectoryId): Future[Boolean] = {
    for {
      directory <- getDirectory(organizationId, dirId)
      subDirectories <- trashDirectoryRepository.getSubDirectories(directory.id)
      results <- restoreDirectories(organizationId, subDirectories ++ Seq(directory))
      _ <- restoreParentIfExist(organizationId, directory)
    } yield results
  }

  /**
    * restore directories and sub directories
    */
  private def restoreDirectories(organizationId: OrganizationId, directories: Seq[Directory]): Future[Boolean] = {
    for {
      isRestore <- directoryRepository.multiRestore(directories)
      isDeleted <- trashDirectoryRepository.multiDelete(directories.map(_.id))
    } yield isRestore && isDeleted
  }

  private def filterRootDirectories(directories: Array[Directory]): Future[Array[Directory]] =
    Future {
      val directoryIds: Array[DirectoryId] = directories.map(_.id)
      directories.filterNot(directory => directoryIds.contains(directory.parentId))
    }

  override def getDirectory(organizationId: OrganizationId, directoryId: DirectoryId): Future[Directory] = {
    trashDirectoryRepository.get(directoryId).map {
      case Some(value) => value
      case None        => throw NotFoundError(s"no directory is found for id $directoryId")
    }
  }

  private def restoreParentIfExist(organizationId: OrganizationId, directory: Directory): Future[Boolean] = {
    trashDirectoryRepository
      .isExist(directory.parentId)
      .map {
        case true =>
          for {
            parentDirectory <- getDirectory(organizationId, directory.parentId)
            isOk <- directoryRepository.restore(parentDirectory)
            _ <- restoreParentIfExist(organizationId, parentDirectory)
          } yield isOk
        case false => Future.False
      }
      .flatten
  }

  override def multiAdd(organizationId: OrganizationId, directories: Seq[Directory]): Future[Boolean] = {
    trashDirectoryRepository.multiInsert(directories)
  }

  override def isOwner(organizationId: OrganizationId, directoryId: DirectoryId, userId: UserId): Future[Boolean] = {
    trashDirectoryRepository.get(directoryId).map {
      case Some(value) => value.ownerId == userId
      case None        => false
    }
  }
}
