package datainsider.analytics.service

import akka.actor.Actor
import com.twitter.inject.Logging
import datainsider.analytics.domain.{AnalyticsConfig, JobInfo, JobStatus, ReportType}
import datainsider.analytics.misc.report.ActiveUserReport
import datainsider.analytics.repository.ReportDataRepository
import datainsider.analytics.service.JobRunnerActor.RunJobEvent
import datainsider.client.domain.org.Organization
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.service.OrgClientService
import datainsider.client.util.JdbcClient
import datainsider.ingestion.util.TimeUtils
import org.apache.commons.lang3.time.StopWatch

@deprecated("no longer used")
object JobRunnerActor {
  case class RunJobEvent(jobInfo: JobInfo)
}

@deprecated("no longer used")
case class JobRunnerActor(
    config: AnalyticsConfig,
    clickHouseClient: JdbcClient,
    jobInfoService: JobInfoService,
    organizationService: OrgClientService,
    activeUserRepository: ReportDataRepository
) extends Actor
    with Logging {

  override def receive: Receive = {
    case RunJobEvent(jobInfo) => processRunJobEvent(jobInfo)
    case x                    => logger.error(s"Received an unknown message: $x")
  }

  private def processRunJobEvent(jobInfo: JobInfo): Unit = {
    var isSuccess: Boolean = false
    val stopWatch = new StopWatch()
    try {
      info(
        s"[START] Report:  ${jobInfo.name} ${TimeUtils.format(jobInfo.reportTime, "dd/MM/yyyy HH:mm:ss.SSS")}"
      )
      stopWatch.start()
      jobInfoService.updateJobStatus(
        jobInfo.jobId,
        System.currentTimeMillis(),
        0,
        jobInfo.runCount.getOrElse(0),
        JobStatus.Running
      )
      val organization = organizationService.getOrganization(jobInfo.organizationId).syncGet()
      isSuccess = runJob(organization, jobInfo)
    } finally {
      stopWatch.stop()
      jobInfoService.updateJobStatus(
        jobInfo.jobId,
        stopWatch.getStartTime,
        stopWatch.getTime.toInt,
        jobInfo.runCount.getOrElse(0) + 1,
        if (isSuccess) JobStatus.Done else JobStatus.Failed
      )
      info(
        s"[END] Report: ${jobInfo.name} ${TimeUtils
          .format(jobInfo.reportTime, "dd/MM/yyyy HH:mm:ss.SSS")} in ${stopWatch
          .formatTime()} ${if (isSuccess) "successfully" else "failed"}"
      )
    }

  }

  private def runJob(organization: Organization, jobInfo: JobInfo): Boolean = {
    jobInfo.reportType match {
      case ReportType.ActiveUsers =>
        ActiveUserReport(config, organization, clickHouseClient, activeUserRepository).run(jobInfo)
      case _ => false
    }
  }

}
