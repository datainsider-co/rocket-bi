package co.datainsider.jobscheduler.service

import co.datainsider.caas.user_profile.client.ProfileClientService
import co.datainsider.jobscheduler.domain.DatabaseType
import co.datainsider.jobscheduler.domain.Ids.JobId
import co.datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import co.datainsider.jobscheduler.domain.job.{Job, JobStatus}
import co.datainsider.jobscheduler.domain.request.{PaginationRequest, PaginationResponse, UpdateJobRequest}
import co.datainsider.jobscheduler.domain.response.JobInfo
import co.datainsider.jobscheduler.domain.source.{DataSource, JdbcSource}
import co.datainsider.jobscheduler.repository.JobRepository
import com.google.inject.Inject
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.ThriftImplicit.RichUserProfileLike
import co.datainsider.caas.user_profile.domain.user.ShortUserProfile
import datainsider.client.exception.BadRequestError
import datainsider.client.util.TimeUtils

trait JobService {

  def create(orgId: Long, creatorId: String, job: Job): Future[JobInfo]

  def delete(orgId: Long, id: JobId): Future[Boolean]

  def multiDelete(orgId: Long, ids: Seq[JobId]): Future[Boolean]

  def update(orgId: Long, request: UpdateJobRequest): Future[Boolean]

  def get(orgId: Long, jobId: JobId): Future[JobInfo]

  def list(orgId: Long, request: PaginationRequest): Future[PaginationResponse[JobInfo]]

  def getWith(orgId: Long, jobStatus: List[JobStatus], from: Int, size: Int): Future[Seq[Job]]

  @deprecated("use multiCreate with jobs instead")
  def multiCreate(orgId: Long, creatorId: String, sampleJob: Job, tableNames: Seq[String]): Future[Boolean]

  def multiCreate(orgId: Long, creatorId: String, jobs: Seq[Job]): Future[Boolean]

}

case class JobServiceImpl @Inject() (
    jobRepository: JobRepository,
    sourceService: DataSourceService,
    profileClientService: ProfileClientService
) extends JobService
    with Logging {
  private val DUMMY_SOURCE: JdbcSource =
    JdbcSource(1L, 0, "invalid data source", DatabaseType.MySql, "asd//zxc:123", "", "")

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
    val statuses: Seq[JobStatus] = request.currentStatuses.map(JobStatus.withName)
    for {
      jobs <- jobRepository.list(orgId, request.from, request.size, request.sorts, request.keyword, statuses)
      total <- jobRepository.count(orgId, request.keyword, statuses)
      jobIds = jobs.map(_.sourceId).distinct
      sourcesMap <- sourceService.multiGet(jobIds)
      profiles <- profileClientService.getUserProfiles(orgId, jobs.map(_.creatorId))
    } yield {
      val data: Seq[JobInfo] = jobs.map(job => {
        val source: DataSource = sourcesMap.getOrElse(job.sourceId, DUMMY_SOURCE)
        val profile: Option[ShortUserProfile] = profiles.get(job.creatorId).map(_.toShortUserProfile)
        JobInfo(job, Some(source), profile)
      })
      PaginationResponse(data, total)
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

  override def multiCreate(
      orgId: JobId,
      creatorId: String,
      baseJob: Job,
      tableNames: Seq[String]
  ): Future[Boolean] = {
    val jobs: Seq[Job] = baseJob.toMultiJob(orgId, creatorId, tableNames)
    multiCreate(orgId, creatorId, jobs)
  }

  override def multiDelete(orgId: JobId, ids: Seq[JobId]): Future[Boolean] = {
    jobRepository.multiDelete(orgId, ids)
  }

  override def multiCreate(orgId: JobId, creatorId: String, jobs: Seq[Job]): Future[Boolean] = {
    val newJobs: Seq[Job] = jobs.map(job => job.copyRunTime(TimeUtils.calculateNextRunTime(job.scheduleTime, None)))
    jobRepository.multiInsert(orgId, creatorId, newJobs)
  }
}
