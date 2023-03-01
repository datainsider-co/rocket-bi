package datainsider.jobworker.service.worker2
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.service.{HadoopFileClientService, LakeClientService, SchemaClientService}
import datainsider.client.util.Implicits.FutureEnhance
import datainsider.jobworker.domain.response.SyncInfo
import datainsider.jobworker.domain.{DataDestination, Job, JobStatus}

/**
  * created 2022-09-13 2:43 PM
  * @author tvc12 - Thien Vi
  */
class FullSyncJobWorker(
    jobWorker: JobWorker2,
    schemaService: SchemaClientService,
    lakeService: LakeClientService,
    hadoopFileClientService: HadoopFileClientService,
    fsPath: String,
    baseDir: String
) extends JobWorker2
    with Logging {

  override def run(
      syncInfo: SyncInfo,
      ensureRunning: () => Future[Unit],
      report: JobWorkerProgress => Future[Unit]
  ): JobWorkerProgress = {
    val tempTableName = s"__di_tmp_${syncInfo.job.destTableName}_${System.currentTimeMillis}"
    val newSyncInfo: SyncInfo = syncInfo.copy(job = syncInfo.job.copyWith(destTableName = tempTableName))

    val finalProgress: JobWorkerProgress = jobWorker.run(newSyncInfo, ensureRunning, report)

    finalProgress.status match {
      case JobStatus.Synced | JobStatus.Terminated => swapTable(finalProgress, syncInfo.job, newSyncInfo.job)
      case JobStatus.Error                         => deleteTable(finalProgress, newSyncInfo.job)
      case _                                       => logger.warn(s"FullSyncJobWorker: job is not finished, current status ${finalProgress.status}")
    }
    finalProgress
  }

  /**
    * swap temp table to real table
    */
  private def swapTable(jobProgress: JobWorkerProgress, oldJob: Job, newJob: Job): Unit = {
    // swap names of newly synced table
    newJob.destinations.distinct.foreach {
      case DataDestination.Clickhouse => handleSwapClickhouseTable(jobProgress, oldJob, newJob)
      case DataDestination.Hadoop     => handleSwapHadoopTable(jobProgress, oldJob, newJob)
      case destination                => logger.warn(s"FullSyncJobWorker: not support swap table for destination ${destination}")
    }
  }

  private def handleSwapClickhouseTable(jobProgress: JobWorkerProgress, oldJob: Job, newJob: Job): Unit = {
    val orgId: Long = oldJob.orgId
    val destDbName: String = oldJob.destDatabaseName
    val destTblName: String = oldJob.destTableName
    val deletedTblName = s"__di_old_${destTblName}_${System.currentTimeMillis}"
    val tempTblName = newJob.destTableName
    try {
      // mark old table as deleted
      if (schemaService.isTblExists(orgId, destDbName, destTblName, Seq.empty).syncGet()) {
        schemaService.renameTableSchema(orgId, destDbName, destTblName, deletedTblName).syncGet()
      }
      // rename new table to old table
      schemaService.renameTableSchema(orgId, destDbName, tempTblName, destTblName).syncGet()
      jobProgress.addMessage(s"Swap table ${destDbName}.${tempTblName} to ${destDbName}.${destTblName} successfully")
      logger.info(s"rename table for full sync job successfully")

    } catch {
      case ex: Throwable =>
        logger.error(s"fail to rename clickhouse table for full-sync job ${newJob}, reason: ${ex.getMessage}", ex)
        jobProgress.addMessage(
          s"Swap table ${destDbName}.${tempTblName} to ${destDbName}.${destTblName} failed, cause ${ex.getMessage}"
        )
    }
  }

  private def handleSwapHadoopTable(jobProgress: JobWorkerProgress, oldJob: Job, newJob: Job): Unit = {
    val destDbName: String = oldJob.destDatabaseName
    val destTblName: String = oldJob.destTableName
    // move old data to trash
    try {
      hadoopFileClientService.moveTrash(fsPath + s"$baseDir/$destDbName/${destTblName}").syncGet()
      jobProgress.addMessage(s"Move old data to trash successfully")
    } catch {
      case ex: Throwable =>
        jobProgress.addMessage(s"Move old data to trash failed, cause ${ex.getMessage}")
        logger.error(s"fail to move old hadoop folder for full-sync job ${newJob}, reason: $ex", ex)
    }
    try {
      hadoopFileClientService.createFolder(fsPath + s"$baseDir", destDbName).syncGet()
      hadoopFileClientService.createFolder(fsPath + s"$baseDir/${destDbName}/", destTblName).syncGet()
      // move tmp data to old folder
      hadoopFileClientService
        .move(
          fsPath + "/tmp" + s"$baseDir/${destDbName}/${newJob.destTableName}",
          fsPath + s"/$baseDir/${destDbName}",
          overwrite = true,
          destTblName
        )
        .syncGet()
      jobProgress.addMessage(s"Move tmp data to destination folder successfully")
    } catch {
      case ex: Throwable =>
        jobProgress.addMessage(s"Move temp data to destination data failed, cause ${ex.getMessage}")
        logger.error(s"fail to move temp folder to synced folder, reason: $ex", ex)
    }
  }

  private def deleteTable(jobProgress: JobWorkerProgress, job: Job): Unit = {
    try {
      // delete temporary table if error occurred
      job.destinations.distinct.foreach {
        case DataDestination.Clickhouse =>
          schemaService.deleteTableSchema(job.orgId, job.destDatabaseName, job.destTableName).syncGet()
          jobProgress.addMessage(s"delete temporary table ${job.destTableName} successfully")
        case _ =>
      }
    } catch {
      case ex: Throwable =>
        logger.error(s"FullSyncJobWorker: delete table ${job.destTableName} error", ex)
        jobProgress.addMessage(s"delete temporary table ${job.destTableName} failed, cause ${ex.getMessage}")
    }
  }
}
