package datainsider.jobscheduler.service

import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.ThriftImplicit.RichUserProfileLike
import datainsider.client.exception.BadRequestError
import datainsider.client.service.{ProfileClientService, SchemaClientService}
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import datainsider.jobscheduler.domain._
import datainsider.jobscheduler.domain.job.{
  BigQueryStorageJob,
  DataDestination,
  FacebookAdsJob,
  GaJob,
  GenericJdbcJob,
  GoogleSheetJob,
  HubspotJob,
  JdbcJob,
  Job,
  MongoJob
}
import datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import datainsider.jobscheduler.domain.request.{PaginationRequest, PaginationResponse, UpdateJobRequest}
import datainsider.jobscheduler.domain.response.{JobInfo, SyncInfo}
import datainsider.jobscheduler.repository.{JobRepository, SourceMetadataRepository}

trait JobService {

  def create(orgId: Long, creatorId: String, job: Job): Future[JobInfo]

  def delete(orgId: Long, id: JobId): Future[Boolean]

  def update(orgId: Long, request: UpdateJobRequest): Future[Boolean]

  def get(orgId: Long, jobId: JobId): Future[JobInfo]

  def list(orgId: Long, request: PaginationRequest): Future[PaginationResponse[JobInfo]]

  def getWith(orgId: Long, jobStatus: List[JobStatus], from: Int, size: Int): Future[Seq[Job]]

  def createMultiJob(orgId: Long, creatorId: String, sampleJob: Job, tableNames: Seq[String]): Future[Boolean]

}

case class JobServiceImpl @Inject() (
    jobRepository: JobRepository,
    sourceService: DataSourceService,
    schemaClientService: SchemaClientService,
    sourceMetadataService: SourceMetadataRepository,
    profileClientService: ProfileClientService
) extends JobService
    with Logging {
  override def create(orgId: Long, creatorId: String, job: Job): Future[JobInfo] = {
    for {
      createdId <-
        jobRepository.insert(orgId, creatorId, job.copyRunTime(TimeUtils.calculateNextRunTime(job.scheduleTime, None)))
      job <- get(orgId, createdId)
    } yield job
  }

  override def delete(orgId: Long, id: JobId): Future[Boolean] = {
    jobRepository.delete(orgId, jobId = Some(id), sourceId = None)
  }

  override def update(orgId: Long, request: UpdateJobRequest): Future[Boolean] = {
    jobRepository.update(orgId, request.job.copyRunTime(TimeUtils.calculateNextRunTime(request.job.scheduleTime, None)))
  }

  override def get(orgId: Long, jobId: JobId): Future[JobInfo] = {
    for {
      job <- fetch(orgId, jobId)
      src <- sourceService.get(orgId, job.sourceId)
      profile <- profileClientService.getUserProfile(orgId, job.creatorId)
    } yield JobInfo(job, src, profile.map(_.toShortUserProfile))
  }

  override def list(orgId: Long, request: PaginationRequest): Future[PaginationResponse[JobInfo]] = {
    for {
      jobs <- jobRepository.list(orgId, request.from, request.size, request.sorts, request.keyword)
      sources <- sourceService.list(
        orgId: Long,
        PaginationRequest(0, 1000, request = null)
      ) // TODO: BAD CODE (because number of source should not be too many)???
      profiles <- profileClientService.getUserProfiles(orgId, jobs.map(_.creatorId))
      total <- jobRepository.count(orgId, request.keyword)
    } yield {
      val sourcesMap: Map[SourceId, DataSource] = sources.data.map(src => src.getId -> src).toMap
      val dummySource: JdbcSource = JdbcSource(1L, 0, "invalid data source", DatabaseType.MySql, "asd//zxc:123", "", "")
      val data: Seq[JobInfo] = jobs.map(job =>
        JobInfo(
          job,
          Some(sourcesMap.getOrElse(job.sourceId, dummySource)),
          profiles.get(job.creatorId).map(_.toShortUserProfile)
        )
      )
      PaginationResponse(data = data, total = total)
    }
  }

  override def getWith(orgId: Long, jobStatus: List[JobStatus], from: Int, size: Int): Future[Seq[Job]] = {
    jobRepository.getWith(orgId, jobStatus, from, size)
  }

  private def fetch(orgId: Long, id: JobId): Future[Job] = {
    jobRepository.get(orgId, id).map {
      case Some(job) => job
      case None      => throw BadRequestError(s"No job was found for id = $id.")
    }
  }

  private def isDestTableSchemaValid(orgId: JobId, job: Job): Future[Boolean] = {
    if (job.destinations.contains(DataDestination.Clickhouse.toString)) {
      for {
        dataSource <- sourceService.get(orgId, job.sourceId)
        destDatabaseSchema <- schemaClientService.getDatabaseSchema(orgId, job.destDatabaseName)
        destTableSchema = destDatabaseSchema.findTableAsOption(job.destTableName)
        sourceTableSchema <- sourceMetadataService.getTableSchema(SyncInfo(0, job, dataSource))
        result =
          if (destTableSchema.isDefined) {
            val isColumnsExist = sourceTableSchema.columns.map(column => destTableSchema.get.columns.contains(column))
            !isColumnsExist.contains(false)
          } else
            true
      } yield result
    } else {
      Future.True
    }
  }

  override def createMultiJob(
      orgId: JobId,
      creatorId: String,
      baseJob: Job,
      tableNames: Seq[String]
  ): Future[Boolean] = {
    val jobs: Seq[Job] = baseJob.toMultiJob(orgId, creatorId, tableNames)
    jobRepository.multiInsert(orgId, creatorId, jobs)
  }
}
