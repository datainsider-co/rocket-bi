package datainsider.analytics.service

import akka.actor.ActorRef
import com.twitter.util.Future
import datainsider.analytics.controller.http.request.RunReportRequest
import datainsider.analytics.domain.{JobInfo, JobStatus, ReportType}
import datainsider.analytics.domain.ReportType.ReportType
import datainsider.analytics.repository.JobFactory
import datainsider.client.domain.org.Organization
import datainsider.client.domain.Page
import datainsider.client.exception.InternalError
import datainsider.client.service.OrgClientService
import datainsider.ingestion.util.TimeUtils

import java.util.TimeZone
import javax.inject.{Inject, Named}
import scala.concurrent.duration.DurationInt

trait JobManagementService {

  def getSchedules(from: Int, size: Int): Future[Page[Map[String, Any]]]

  def schedule(request: RunReportRequest): Future[Seq[JobInfo]]

  def retry(jobId: String): Future[JobInfo]

}

case class JobManagementServiceImpl @Inject() (
    queue: BaseScheduleQueue,
    jobFactory: JobFactory,
    jobInfoService: JobInfoService,
    organizationService: OrgClientService,
    @Named("job_runner_actor") jobRunnerActor: ActorRef
) extends JobManagementService {

  override def getSchedules(from: Int, size: Int): Future[Page[Map[String, Any]]] = {
    queue.getSchedules(from, size)
  }

  override def schedule(request: RunReportRequest): Future[Seq[JobInfo]] = {
    for {
      organization <- organizationService.getOrganization(request.organizationId)
      jobInfos <- jobInfoService.multiAddJobInfos(createJobInfo(request, organization))
    } yield {
      jobInfos.foreach(jobInfo => {
        jobRunnerActor ! JobRunnerActor.RunJobEvent(jobInfo)
      })
      jobInfos
    }
  }

  override def retry(jobId: String): Future[JobInfo] = {
    for {
      jobInfo <- jobInfoService.getJobInfo(jobId)
      r <- run(jobInfo)
    } yield r
  }

  private def run(jobInfo: JobInfo): Future[JobInfo] = {
    val job = jobInfo.copy(
      startedTime = Some(System.currentTimeMillis()),
      duration = Some(0),
      jobStatus = JobStatus.Waiting
    )
    for {
      isOK <-
        jobInfoService
          .updateJobStatus(
            job.jobId,
            job.startedTime.get,
            job.duration.getOrElse(0),
            job.runCount.getOrElse(0),
            job.jobStatus
          )
    } yield isOK match {
      case true =>
        jobRunnerActor ! JobRunnerActor.RunJobEvent(job)
        job
      case _ => throw InternalError(s"Error to run the job: ${job.jobId}")
    }

  }

  private def createJobInfo(request: RunReportRequest, organization: Organization): Seq[JobInfo] = {
    val reportTimeZone = organization.reportTimeZoneId.map(TimeZone.getTimeZone(_))
    val fromTime = TimeUtils.parse(request.fromDate, "dd/MM/yyyy", reportTimeZone)
    val toTime = TimeUtils.parse(request.toDate, "dd/MM/yyyy", reportTimeZone)

    List
      .range(fromTime, toTime + 1.days.toMillis, 1.days.toMillis)
      .map(createJobInfo(request.reportType, organization, _))
      .filter(_.isDefined)
      .map(_.get)

  }

  private def createJobInfo(
      reportType: ReportType,
      organization: Organization,
      time: Long
  ): Option[JobInfo] = {
    reportType match {
      case ReportType.ActiveUsers => Some(jobFactory.createActiveUserJobInfo(organization, time))
      case _                      => None
    }
  }
}
