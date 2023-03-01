package datainsider.jobworker.service

import com.fasterxml.jackson.databind.JsonNode
import com.google.inject.Inject
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.util.JsonParser
import datainsider.jobworker.domain.response.SyncInfo
import datainsider.jobworker.domain.{JobProgress, JobStatus}
import datainsider.jobworker.repository.ScheduleRepository
import datainsider.notification.service.NotificationService

import scala.util.Try

trait ScheduleService {

  def getJob: Future[Option[SyncInfo]]

  def reportJob(jobProcess: JobProgress): Future[Boolean]
}

class ScheduleServiceImpl @Inject() (scheduleRepo: ScheduleRepository, notificationService: NotificationService)
    extends ScheduleService
    with Logging {

  override def getJob: Future[Option[SyncInfo]] = scheduleRepo.getJob.map(_.data)

  override def reportJob(jobProcess: JobProgress): Future[Boolean] = {
    for {
      _ <- notifyJobError(jobProcess)
      reportOk <- scheduleRepo.reportJob(jobProcess)
    } yield reportOk
  }

  private def notifyJobError(jobProgress: JobProgress): Future[Unit] = {
    if (jobProgress.jobStatus == JobStatus.Error) {
      notificationService
        .push(
          jobProgress.orgId,
          "job-worker",
          s"${this.getClass.getSimpleName}::notifyJobError",
          s"Job ${jobProgress.jobId} run failure, cause ${jobProgress.message.getOrElse("<unknown error>")}"
        )
        .rescue {
          case ex: Throwable =>
            error(ex.getMessage, ex)
            Future.Unit
        }
    } else {
      Future.Unit
    }
  }
}
