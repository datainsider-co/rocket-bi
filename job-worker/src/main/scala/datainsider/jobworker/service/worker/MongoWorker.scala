package datainsider.jobworker.service.worker

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.column.Column
import datainsider.client.domain.schema.{DatabaseSchema, TableSchema}
import datainsider.client.service.SchemaClientService
import datainsider.client.util.ZConfig
import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain._
import datainsider.jobworker.repository.reader.MongoReader
import datainsider.jobworker.repository.writer.DataWriter
import datainsider.jobworker.util.Implicits.FutureEnhance
import datainsider.jobworker.util.MongoSupportUtils
import datainsider.jobworker.util.StringUtils.getOriginTblName
import education.x.commons.SsdbKVS
import jdk.nashorn.internal.ir.debug.ObjectSizeCalculator

import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.control.NonFatal

class MongoWorker(source: MongoSource, schemaService: SchemaClientService, ssdbKVS: SsdbKVS[Long, Boolean])
    extends JobWorker[MongoJob]
    with Logging {

  val isRunning: AtomicBoolean = new AtomicBoolean(true)

  override def run(job: MongoJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress =
    try {
      sync(job, syncId, onProgress)
    } catch {
      case throwable: Throwable =>
        error(throwable.getLocalizedMessage, throwable)
        MongoProgress(
          job.orgId,
          syncId,
          job.jobId,
          System.currentTimeMillis(),
          JobStatus.Error,
          0,
          0,
          job.lastSyncedValue,
          Some(throwable.toString)
        )
    } finally {
      ssdbKVS.remove(syncId)
    }

  private def sync(job: MongoJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    val reader = MongoReader(source, job)
    val sourceTableSchema: TableSchema = reader.getTableSchema.copy(
      dbName = job.destDatabaseName,
      name = job.destTableName,
      displayName = getOriginTblName(job.destTableName)
    )
    val originTableName = getOriginTableSchema(job)
    val destTableSchema: Option[TableSchema] = getDestTableSchema(job.orgId, job.destDatabaseName, originTableName)

    val tableSchema = mergeTableSchema(sourceTableSchema, destTableSchema)
    var rowInserted: Long = 0
    var lastSyncedValue: String = job.lastSyncedValue
    val writers: Seq[DataWriter] = job.destinations.map(dest => DataWriter(dest))
    val incrementalColumnIndex: Int = job.incrementalColumn match {
      case Some(value) => tableSchema.columns.indexWhere(_.name == value)
      case None        => 0
    }

    val beginTime: Long = System.currentTimeMillis()
    val jobProgress = MongoProgress(
      job.orgId,
      syncId,
      job.jobId,
      System.currentTimeMillis(),
      JobStatus.Syncing,
      0,
      System.currentTimeMillis() - beginTime,
      lastSyncedValue
    )
    onProgress(jobProgress)
    ensureTableSchema(tableSchema, job.destinations)

    def reportStatus(): Unit = {
      // report sync status to job-scheduler
      val batchSyncedSucceed: JobProgress = jobProgress.copy(
        updatedTime = System.currentTimeMillis(),
        totalSyncRecord = rowInserted,
        totalExecutionTime = System.currentTimeMillis() - beginTime,
        lastSyncedValue = lastSyncedValue
      )
      onProgress(batchSyncedSucceed)

      // check terminate signal from job-scheduler
      ssdbKVS.get(syncId).map {
        case Some(value) => isRunning.set(value)
        case None        =>
      }
    }

    while (reader.hasNext && isRunning.get()) {
      try {
        val records = reader.getNextRecords(tableSchema.columns)
        writers.foreach(writer => {
          if (records.nonEmpty) try {
            writer.write(records, tableSchema)
            lastSyncedValue = records.last(incrementalColumnIndex).toString
          } catch {
            case e: Throwable => error(s"${writer.getClass} write ${records.length} records failed, reason: $e")
          }
        })

        rowInserted = rowInserted + records.length
      } catch {
        case e: Throwable =>
          error(s"error when sync", e)
      } finally {
        reportStatus()
      }
    }

    writers.foreach(_.finishing())
    reader.cleanUp()

    info("*******************************************************************")
    info(s"memory reader use: ${ObjectSizeCalculator.getObjectSize(reader)}")

    val finalStatus: JobStatus =
      if (isRunning.get()) {
        JobStatus.Synced
      } else {
        JobStatus.Terminated
      }

    jobProgress.copy(
      jobStatus = finalStatus,
      updatedTime = System.currentTimeMillis(),
      totalSyncRecord = rowInserted,
      totalExecutionTime = System.currentTimeMillis() - beginTime,
      lastSyncedValue = lastSyncedValue
    )
  }

  private def ensureTableSchema(tableSchema: TableSchema, destinations: Seq[DataDestination]): Unit = {
    info(s"schema: $tableSchema")
    destinations.foreach {
      case DataDestination.Clickhouse =>
        schemaService.createOrMergeTableSchema(tableSchema).sync()
      case DataDestination.Hadoop =>
    }
  }

  private def getOldTableSchema(organizationId: Long, dbName: String, tblName: String): Option[TableSchema] = {
    try {
      Some(schemaService.getTable(organizationId, dbName, tblName).sync())
    } catch {
      case ex: Throwable => None
    }
  }

  private def getOriginTableSchema(job: MongoJob): String = {
    job.syncMode match {
      case SyncMode.FullSync        => getOriginTblName(job.destTableName)
      case SyncMode.IncrementalSync => job.destTableName
    }
  }

  private def getDestTableSchema(organizationId: Long, dbName: String, tblName: String): Option[TableSchema] = {
    var retry: Int = ZConfig.getInt("mongodb_worker.get_dest_database_schema.retry_time", 3)
    var tableAsOption: Option[TableSchema] = None
    var isSuccess: Boolean = false
    while ((retry > 0) && (!isSuccess)) {
      try {
        val databaseSchema: DatabaseSchema = schemaService.getDatabaseSchema(organizationId, dbName).sync()
        tableAsOption = databaseSchema.findTableAsOption(tblName)
        isSuccess = true
      } catch {
        case ex: Throwable => error(s"got fail to get dest table, ${ex.getMessage}")
      }
      retry = retry - 1
    }
    if (isSuccess) {
      tableAsOption
    } else {
      throw new Exception(s"fail to interact with ingestion-service when ensure destination table")
    }
  }
}
