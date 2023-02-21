package datainsider.analytics.service

import com.twitter.util.Future
import datainsider.analytics.domain.{JobInfo, JobStatus}
import datainsider.analytics.domain.JobStatus.JobStatus
import datainsider.analytics.domain.ReportType.ReportType
import datainsider.analytics.repository.JobInfoRepository
import datainsider.client.domain.Page
import datainsider.client.exception.{InternalError, NotFoundError}

import javax.inject.Inject

trait JobInfoService {
  def list(from: Int, size: Int): Future[Page[JobInfo]]

  def getJobInfo(jobId: String): Future[JobInfo]

  def getJobInfo(organizationId: Long, reportType: ReportType, reportTime: Long): Future[Option[JobInfo]]

  def addJobInfo(jobInfo: JobInfo): Future[JobInfo]

  def multiAddJobInfos(jobInfos: Seq[JobInfo]): Future[Seq[JobInfo]]

  def updateJobStatus(
      jobId: String,
      startedTime: Long,
      duration: Int,
      runCount: Int,
      jobStatus: JobStatus
  ): Future[Boolean]

  def deleteJobInfo(jobId: String): Future[Boolean]

  def getUncompletedJobInfos(from: Int, size: Int): Future[Page[JobInfo]]
}

case class JobInfoServiceImpl @Inject() (jobInfoRepository: JobInfoRepository) extends JobInfoService {

  override def list(from: Int, size: Int): Future[Page[JobInfo]] = {
    jobInfoRepository.list(from, size)
  }

  override def getJobInfo(jobId: String): Future[JobInfo] = {
    jobInfoRepository.getJobInfo(jobId).map {
      case Some(r) => r
      case _       => throw NotFoundError(s"The job was not found for job_id=$jobId")
    }
  }

  override def getJobInfo(organizationId: Long, reportType: ReportType, reportTime: Long): Future[Option[JobInfo]] = {
    jobInfoRepository.getJobInfo(organizationId, reportType, reportTime)
  }

  override def addJobInfo(jobInfo: JobInfo): Future[JobInfo] = {
    jobInfoRepository.addJobInfo(jobInfo)
  }

  override def multiAddJobInfos(jobInfos: Seq[JobInfo]): Future[Seq[JobInfo]] = {
    jobInfoRepository.addJobInfos(jobInfos).map {
      case count if count > 0 => jobInfos
      case _                  => throw InternalError(s"The job was saved.")
    }
  }

  override def updateJobStatus(
      jobId: String,
      startedTime: Long,
      duration: Int,
      runCount: Int,
      jobStatus: JobStatus
  ): Future[Boolean] = {
    jobInfoRepository.updateJobStatus(jobId, startedTime, duration, runCount, jobStatus)
  }

  override def deleteJobInfo(jobId: String): Future[Boolean] = {
    jobInfoRepository.deleteJobInfo(jobId)
  }

  override def getUncompletedJobInfos(from: Int, size: Int): Future[Page[JobInfo]] = {
    val jobStatues = Seq(JobStatus.Idle, JobStatus.Waiting, JobStatus.Running)
    jobInfoRepository.searchJobInfos(jobStatues, from, size)
  }

}
