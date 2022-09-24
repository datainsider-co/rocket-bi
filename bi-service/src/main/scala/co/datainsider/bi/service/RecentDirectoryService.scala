package co.datainsider.bi.service

import co.datainsider.bi.domain.Directory
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.repository.{DirectoryRepository, RecentDirectoryRepository}
import com.twitter.util.Future

import javax.inject.Inject

trait RecentDirectoryService {

  def list(organizationId: Long, username: String, from: Int, size: Int): Future[Array[Directory]]

  def addOrUpdate(organizationId: DirectoryId, username: String, id: DirectoryId): Future[Boolean]

  def delete(organizationId: DirectoryId, id: DirectoryId): Future[Boolean]
}

class RecentDirectoryServiceImpl @Inject() (
    recentDashboardRepository: RecentDirectoryRepository,
    directoryRepository: DirectoryRepository
) extends RecentDirectoryService {

  override def list(organizationId: Long, username: String, from: Int, size: Int): Future[Array[Directory]] = {
    for {
      recentDirIds <- recentDashboardRepository.list(organizationId, username, from, size)
      directories <- directoryRepository.list(recentDirIds)
    } yield directories
  }

  override def addOrUpdate(organizationId: DirectoryId, username: String, id: DirectoryId): Future[Boolean] = {
    recentDashboardRepository.addOrUpdate(organizationId, username, id)
  }

  override def delete(organizationId: DirectoryId, id: DirectoryId): Future[Boolean] = {
    recentDashboardRepository.delete(organizationId, id)
  }
}
