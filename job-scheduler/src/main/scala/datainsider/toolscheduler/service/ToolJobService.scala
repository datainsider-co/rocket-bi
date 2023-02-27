package datainsider.toolscheduler.service

import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.request.{PaginationResponse, SortRequest}
import datainsider.toolscheduler.domain.{ToolJob, ToolJobStatus}
import datainsider.toolscheduler.domain.request.UpdateToolJobRequest
import datainsider.toolscheduler.repository.ToolJobRepository

trait ToolJobService {
  def forceRun(orgId: Long, jobId: Long, atTime: Long): Future[Boolean]

  def get(orgId: Long, jobId: Long): Future[ToolJob]

  def list(orgId: Long, keyword: String, from: Int, size: Int, sortRequests: Seq[SortRequest]): Future[PaginationResponse[ToolJob]]

  def create(toolJob: ToolJob): Future[ToolJob]

  def update(newJob: ToolJob): Future[Boolean]

  def update(orgId: Long, jobId: Long, request: UpdateToolJobRequest): Future[Boolean]

  def delete(orgId: Long, jobId: Long): Future[Boolean]

  def getNextJob(atTime: Long): Future[Option[ToolJob]]
}

class ToolJobServiceImpl @Inject() (toolJobRepository: ToolJobRepository) extends ToolJobService {

  private lazy val ignoreForceRunStatusSet = Set(ToolJobStatus.Queued, ToolJobStatus.Running)

  override def get(orgId: Long, jobId: Long): Future[ToolJob] = {
    toolJobRepository.get(orgId, jobId).map {
      case Some(job) => job
      case None      => throw BadRequestError(s"not found job for orgId = $orgId, jobId = $jobId")
    }
  }

  override def list(orgId: Long, keyword: String, from: Int, size: Int, sortRequests: Seq[SortRequest]): Future[PaginationResponse[ToolJob]] = {
    for {
      total <- toolJobRepository.count(orgId, keyword)
      jobs <- toolJobRepository.list(orgId, keyword, from, size, sortRequests)
    } yield PaginationResponse(jobs, total)
  }

  override def create(toolJob: ToolJob): Future[ToolJob] = {
    for {
      createdId <- toolJobRepository.create(toolJob)
      toolJob <- get(toolJob.orgId, createdId)
    } yield toolJob
  }

  override def update(newJob: ToolJob): Future[Boolean] = {
    toolJobRepository.update(newJob)
  }

  override def update(orgId: Long, jobId: Long, request: UpdateToolJobRequest): Future[Boolean] = {
    for {
      toolJob <- get(orgId, jobId)
      newToolJob = toolJob.copy(
        name = request.name.getOrElse(toolJob.name),
        description = request.description.getOrElse(toolJob.description),
        jobData = request.jobData.getOrElse(toolJob.jobData),
        scheduleTime = request.scheduleTime.getOrElse(toolJob.scheduleTime),
        nextRunTime = request.calcNextRunTime().getOrElse(toolJob.nextRunTime),
        updatedBy = request.currentUsername,
        updatedAt = System.currentTimeMillis()
      )
      updateOk <- toolJobRepository.update(newToolJob)
    } yield updateOk
  }

  override def delete(orgId: Long, jobId: Long): Future[Boolean] = {
    toolJobRepository.delete(orgId, jobId)
  }

  override def getNextJob(atTime: Long): Future[Option[ToolJob]] = {
    toolJobRepository.getNextJob(atTime)
  }

  override def forceRun(orgId: Long, jobId: Long, atTime: Long): Future[Boolean] = {
    for {
      job <- get(orgId, jobId)
      isForceRun <- if (ignoreForceRunStatusSet.contains(job.currentRunStatus)) {
        Future.False
      } else {
        val newJob = job.copy(
          nextRunTime = atTime,
          updatedAt = System.currentTimeMillis()
        )
        toolJobRepository.update(newJob)
      }
    } yield isForceRun
  }
}
