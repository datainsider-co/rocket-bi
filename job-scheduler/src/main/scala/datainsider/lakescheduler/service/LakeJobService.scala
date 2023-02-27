package datainsider.lakescheduler.service

import com.twitter.util.Future
import datainsider.client.domain.ThriftImplicit._
import datainsider.client.exception.BadRequestError
import datainsider.client.service.ProfileClientService
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.Ids.JobId
import datainsider.jobscheduler.domain.job.JobStatus.JobStatus
import datainsider.jobscheduler.domain.request.PaginationResponse
import datainsider.lakescheduler.domain.job.LakeJob
import datainsider.lakescheduler.domain.request.{ListLakeJobRequest, UpdateLakeJobRequest}
import datainsider.lakescheduler.domain.response.LakeJobResponse
import datainsider.lakescheduler.repository.LakeJobRepository

import javax.inject.Inject

trait LakeJobService {
  def create(orgId: Long, job: LakeJob): Future[LakeJobResponse]

  def delete(orgId: Long, id: JobId): Future[Boolean]

  def update(orgId: Long, request: UpdateLakeJobRequest): Future[Boolean]

  def get(orgId: Long, jobId: JobId): Future[LakeJobResponse]

  def list(orgId: Long, request: ListLakeJobRequest): Future[PaginationResponse[LakeJobResponse]]

  def getWith(orgId: Long, jobStatus: List[JobStatus], from: Int, size: Int): Future[Seq[LakeJob]]
}

case class LakeJobServiceImpl @Inject() (
    lakeJobRepository: LakeJobRepository,
    profileClientService: ProfileClientService
) extends LakeJobService {

  override def create(orgId: Long, job: LakeJob): Future[LakeJobResponse] = {
    for {
      jobId <- lakeJobRepository.insert(orgId, job.customCopy(nextRunTime = TimeUtils.calculateNextRunTime(job.scheduleTime, None)))
      job <- lakeJobRepository.get(orgId, jobId)
    } yield job match {
      case None        => throw new InternalError("Fail to get job")
      case Some(value) => toLakeJobResponse(value)
    }
  }.flatten

  override def delete(orgId: Long, id: JobId): Future[Boolean] = {
    lakeJobRepository.delete(orgId, id)
  }

  override def update(orgId: Long, request: UpdateLakeJobRequest): Future[Boolean] = {
    lakeJobRepository.update(orgId, request.job.customCopy(nextRunTime = TimeUtils.calculateNextRunTime(request.job.scheduleTime, None)))
  }

  override def get(orgId: Long, jobId: JobId): Future[LakeJobResponse] = {
    lakeJobRepository.get(orgId, jobId).map {
      case None      => throw BadRequestError(s"No job was found for id = $jobId.")
      case Some(job) => toLakeJobResponse(job)
    }
  }.flatten

  override def list(orgId: Long, request: ListLakeJobRequest): Future[PaginationResponse[LakeJobResponse]] = {
    for {
      jobs <- lakeJobRepository.list(orgId, request.keyword, request.from, request.size, request.sorts)
      responses <- toLakeJobResponses(orgId, jobs)
      total <- lakeJobRepository.count(orgId, request.keyword)
    } yield PaginationResponse(data = responses, total = total)
  }

  override def getWith(orgId: Long, jobStatus: List[JobStatus], from: Int, size: Int): Future[Seq[LakeJob]] = {
    lakeJobRepository.getWith(orgId, jobStatus, from, size)
  }

  private def toLakeJobResponses(orgId: Long, jobs: Seq[LakeJob]): Future[Seq[LakeJobResponse]] = {
    val creatorIds: Seq[String] = jobs.map(_.creatorId).distinct
    for {
      creatorProfiles <- profileClientService.getUserProfiles(orgId, creatorIds)
      responses = jobs.map(job => LakeJobResponse(job, creatorProfiles.get(job.creatorId).map(_.toShortUserProfile)))
    } yield responses
  }

  private def toLakeJobResponse(job: LakeJob): Future[LakeJobResponse] = {
    profileClientService.getUserProfile(job.orgId, job.creatorId).map(userProfile => LakeJobResponse(job, userProfile.map(_.toShortUserProfile)))
  }
}
