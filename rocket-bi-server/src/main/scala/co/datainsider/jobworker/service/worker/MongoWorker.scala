package co.datainsider.jobworker.service.worker

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.domain.job.MongoJob
import co.datainsider.jobworker.domain.source.MongoSource
import co.datainsider.jobworker.repository.reader.MongoReader
import co.datainsider.jobworker.repository.writer.DataWriter
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.jobworker.util.StringUtils.getOriginTblName
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema}
import co.datainsider.schema.client.SchemaClientService
import education.x.commons.KVS
import jdk.nashorn.internal.ir.debug.ObjectSizeCalculator

import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.ExecutionContext.Implicits.global

class MongoWorker(
    source: MongoSource,
    schemaService: SchemaClientService,
    jobInQueue: KVS[Long, Boolean],
    engine: Engine[Connection],
    connection: Connection
) extends JobWorker[MongoJob]
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
      jobInQueue.remove(syncId)
    }

  private def sync(job: MongoJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    val beginTime: Long = System.currentTimeMillis()
    var lastSyncedValue: String = job.lastSyncedValue

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
    val writers: Seq[DataWriter] = Seq(engine.createWriter(connection))
    val incrementalColumnIndex: Int = job.incrementalColumn match {
      case Some(value) => tableSchema.columns.indexWhere(_.name == value)
      case None        => 0
    }

    schemaService.createOrMergeTableSchema(tableSchema).sync()

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
      jobInQueue.get(syncId).map {
        case Some(value) => isRunning.set(value)
        case None        =>
      }
    }

    while (reader.hasNext && isRunning.get()) {
      try {
        val records = reader.getNextRecords(tableSchema.columns)
        writers.foreach(writer => {
          if (records.nonEmpty) try {
            writer.insertBatch(records, tableSchema)
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

    writers.foreach(_.close())
    reader.cleanUp()

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
