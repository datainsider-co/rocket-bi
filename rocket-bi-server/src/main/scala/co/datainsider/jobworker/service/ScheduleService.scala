package co.datainsider.jobworker.service

import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.caas.user_profile.util.JsonParser
import co.datainsider.jobworker.domain.response.SyncInfo
import co.datainsider.jobworker.domain.source.JdbcSource
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.repository.ScheduleRepository
import com.google.inject.Inject
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.notification.service.NotificationService

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

class MockScheduleService extends ScheduleService {
  var count = 1
  val orgId = 0
  val connection = ClickhouseConnection(
    orgId = orgId,
    host = "localhost",
    username = "default",
    password = "",
    httpPort = 8123,
    tcpPort = 9000,
    useSsl = false,
    clusterName = None,
    properties = Map.empty
  )

  override def getJob: Future[Option[SyncInfo]] = {
    count += 1

    if (count % 10 == 0) {
      val syncInfo = SyncInfo(
        syncId = count,
        job = JdbcJob(
          orgId = orgId,
          jobId = 1,
          jobType = JobType.Jdbc,
          syncMode = SyncMode.FullSync,
          sourceId = 1,
          lastSuccessfulSync = 0,
          syncIntervalInMn = 10,
          lastSyncStatus = JobStatus.Init,
          currentSyncStatus = JobStatus.Init,
          destDatabaseName = "ingestion",
          destTableName = "organization",
          destinations = Seq.empty,
          databaseName = "caas",
          tableName = "organization",
          incrementalColumn = None,
          lastSyncedValue = "0",
          maxFetchSize = 1000,
          query = None
        ),
        source = Some(
          JdbcSource(
            orgId = orgId,
            id = 1,
            displayName = "local mysql",
            databaseType = DatabaseType.MySql,
            jdbcUrl = "jdbc:mysql://localhost:3306",
            username = "root",
            password = "di@2020!"
          )
        ),
        connection = connection
      )

      Future(Some(syncInfo))
    } else Future.None
  }

  override def reportJob(jobProcess: JobProgress): Future[Boolean] = Future.True
}
