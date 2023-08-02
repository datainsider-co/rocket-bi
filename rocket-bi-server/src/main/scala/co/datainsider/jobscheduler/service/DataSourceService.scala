package co.datainsider.jobscheduler.service

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.request.{PaginationRequest, PaginationResponse}
import co.datainsider.jobscheduler.domain.source.DataSource
import co.datainsider.jobscheduler.repository.{DataSourceRepository, JobRepository}
import com.google.inject.Inject
import com.twitter.util.Future

trait DataSourceService {

  def create(orgId: Long, creatorId: String, dataSource: DataSource): Future[Option[DataSource]]

  def list(orgId: Long, request: PaginationRequest): Future[PaginationResponse[DataSource]]

  def delete(orgId: Long, id: SourceId): Future[Boolean]

  def update(orgId: Long, source: DataSource): Future[Boolean]

  def get(orgId: Long, id: SourceId): Future[Option[DataSource]]

  def transferOwnerId(orgId: Long, fromUsername: String, toUsername: String): Future[Boolean]

  def deleteByOwnerId(orgId: Long, username: String): Future[Boolean]

  def multiGet(ids: Seq[SourceId]): Future[Map[SourceId, DataSource]]

  def multiDelete(orgId: Long, ids: Seq[SourceId]): Future[Boolean]
}

class DataSourceServiceImpl @Inject() (sourceRepository: DataSourceRepository, jobRepository: JobRepository)
    extends DataSourceService {

  override def create(orgId: Long, creatorId: String, dataSource: DataSource): Future[Option[DataSource]] = {
    for {
      createdId <- sourceRepository.insert(orgId, creatorId, dataSource)
      dataSource <- get(orgId: Long, createdId)
    } yield dataSource
  }

  override def list(orgId: Long, request: PaginationRequest): Future[PaginationResponse[DataSource]] = {
    for {
      sources <- sourceRepository.list(orgId, request.from, request.size, request.sorts, request.keyword)
      total <- sourceRepository.count(orgId, request.keyword)
    } yield PaginationResponse(sources, total)
  }

  override def delete(orgId: Long, id: SourceId): Future[Boolean] = {
    for {
      sourceOk <- sourceRepository.delete(orgId, id)
      jobOk <- jobRepository.delete(orgId, sourceId = Some(id), jobId = None)
    } yield sourceOk && jobOk
  }

  override def update(orgId: Long, source: DataSource): Future[Boolean] = sourceRepository.update(orgId, source)

  override def get(orgId: Long, id: SourceId): Future[Option[DataSource]] = {
    sourceRepository.get(orgId, id)
  }

  override def transferOwnerId(orgId: SourceId, fromUsername: String, toUsername: String): Future[Boolean] = {
    for {
      _ <- sourceRepository.transferOwnerId(orgId, fromUsername, toUsername)
    } yield true
  }

  override def deleteByOwnerId(orgId: SourceId, username: String): Future[Boolean] = {
    for {
      dataSources <- sourceRepository.listByUsername(orgId, username)
      _ <- jobRepository.deleteBySourceIds(orgId, dataSources.map(_.getId))
      _ <- sourceRepository.deleteByUsername(orgId, username)
    } yield true
  }

  override def multiGet(ids: Seq[SourceId]): Future[Map[SourceId, DataSource]] = {
    if (ids.isEmpty) {
      Future.value(Map.empty)
    } else {
      sourceRepository.multiGet(ids)
    }
  }

  override def multiDelete(orgId: Long, ids: Seq[SourceId]): Future[Boolean] = {
    for {
      sourceOk <- sourceRepository.multiDelete(orgId, ids)
      jobOk <- jobRepository.deleteBySourceIds(orgId, ids)
    } yield sourceOk && jobOk
  }
}
