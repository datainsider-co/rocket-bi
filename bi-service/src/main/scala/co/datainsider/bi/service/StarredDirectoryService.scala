package co.datainsider.bi.service

import co.datainsider.bi.domain.Directory
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain.response.DirectoryResponse
import co.datainsider.bi.repository.{DirectoryRepository, StarredDirectoryRepository}
import com.twitter.util.Future

import javax.inject.Inject

trait StarredDirectoryService {
  def list(organizationId: Long, username: String, from: Int, size: Int): Future[Array[Directory]]

  def star(organizationId: Long, username: String, directoryId: DirectoryId): Future[Boolean]

  def unstar(organizationId: Long, username: String, directoryId: DirectoryId): Future[Boolean]

  def count(organizationId: Long, username: String): Future[Int]

  def deleteByUsername(organizationId: Long, username: String): Future[Boolean]
}

class StarredDirectoryServiceImpl @Inject() (
    directoryRepository: DirectoryRepository,
    starredDirectoryRepository: StarredDirectoryRepository
) extends StarredDirectoryService {
  override def list(
      organizationId: Long,
      username: String,
      from: Int,
      size: Int
  ): Future[Array[Directory]] = {
    for {
      staredDirectoryIds <- starredDirectoryRepository.list(organizationId, username, from, size)
      directories <- directoryRepository.list(staredDirectoryIds)
    } yield directories
  }

  override def star(organizationId: Long, username: String, directoryId: DirectoryId): Future[Boolean] = {
    starredDirectoryRepository.star(organizationId, username, directoryId)
  }

  override def unstar(
      organizationId: Long,
      username: String,
      directoryId: DirectoryId
  ): Future[Boolean] = {
    starredDirectoryRepository.unstar(organizationId, username, directoryId)
  }

  override def count(organizationId: DirectoryId, username: String): Future[Int] = {
    starredDirectoryRepository.count(organizationId, username)
  }

  override def deleteByUsername(organizationId: DirectoryId, username: String): Future[Boolean] = {
    starredDirectoryRepository.deleteByUsername(organizationId, username)
  }
}
