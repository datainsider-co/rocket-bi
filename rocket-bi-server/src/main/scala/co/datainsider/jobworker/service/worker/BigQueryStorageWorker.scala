package co.datainsider.jobworker.service.worker

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.ZConfig
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.job.BigQueryStorageJob
import co.datainsider.jobworker.domain.source.GoogleServiceAccountSource
import co.datainsider.jobworker.domain.{BigqueryStorageProgress, DataDestination, JobProgress, JobStatus}
import co.datainsider.jobworker.repository.reader.{BigQueryStorageReader, BigQueryStorageReaderImpl}
import co.datainsider.jobworker.repository.writer.DataWriter
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.column.Column
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import education.x.commons.KVS

import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.ExecutionContext.Implicits.global

class BigQueryStorageWorker(
    source: GoogleServiceAccountSource,
    schemaService: SchemaClientService,
    jobInQueue: KVS[Long, Boolean],
    engine: Engine[Connection],
    connection: Connection
) extends JobWorker[BigQueryStorageJob]
    with Logging {

  val startTime: Long = System.currentTimeMillis()
  val isRunning: AtomicBoolean = new AtomicBoolean(true)

  override def run(job: BigQueryStorageJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    logger.info(s"${Thread.currentThread().getName}: begin job: $job")
    try {
      sync(job, syncId, onProgress)
    } catch {
      case e: Throwable =>
        val error: JobProgress =
          BigqueryStorageProgress(
            job.orgId,
            syncId,
            job.jobId,
            System.currentTimeMillis(),
            JobStatus.Error,
            totalSyncRecord = 0,
            totalExecutionTime = System.currentTimeMillis() - startTime,
            job.lastSyncedValue,
            Some(e.getMessage)
          )
        logger.error(s"execute job fail: $job", e)
        error
    } finally {
      jobInQueue.remove(syncId)
      logger.info(s"${Thread.currentThread().getName}: finish job: $job")
    }
  }

  private def sync(job: BigQueryStorageJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    val baseProgress =
      BigqueryStorageProgress(
        job.orgId,
        syncId,
        job.jobId,
        startTime,
        JobStatus.Syncing,
        totalSyncRecord = 0,
        System.currentTimeMillis() - startTime,
        job.lastSyncedValue
      )
    onProgress(baseProgress)

    val reportEveryNBatch: Int = ZConfig.getInt("job_worker.report_every_n_batch", 1000) // report every batch
    val reader: BigQueryStorageReaderImpl = BigQueryStorageReader(source, job, None)
    val writers: Seq[DataWriter] = Seq(engine.createWriter(connection))
    val sourceTableSchema: TableSchema = reader.getTableSchema
    val destTableSchema: Option[TableSchema] = getDestTableSchema(job.orgId, job.destDatabaseName, job.destTableName)
    val tableSchema: TableSchema = mergeTableSchema(sourceTableSchema, destTableSchema)
    val incrementalColumnIndex: Int = job.incrementalColumn match {
      case Some(value) => tableSchema.columns.indexWhere(_.name == value)
      case None        => 0
    }
    schemaService.createOrMergeTableSchema(tableSchema).sync()

    var readRows: Long = 0
    var batchNumber: Int = 0
    var lastSyncedValue: String = job.lastSyncedValue

    def pullData(): Unit =
      Profiler(s"[JobWorker] ${this.getClass.getSimpleName}::pullData") {
        val records: Seq[Record] = reader.next
        if (records.nonEmpty) {
          writers.foreach(writer => {
            try {
              writer.write(records, tableSchema)
              lastSyncedValue = records.last(incrementalColumnIndex).toString
            } catch {
              case e: Throwable =>
                error(s"${writer.getClass} write ${records.length} records failed, reason: ${e.getMessage}")
            }
          })
        }
        readRows += records.length
      }

    def reportStatus(): Unit =
      Profiler(s"[JobWorker] ${this.getClass.getSimpleName}::reportStatus") {
        // report sync status to job-scheduler
        val batchSyncedSucceed: JobProgress = baseProgress.copy(
          updatedTime = System.currentTimeMillis(),
          totalSyncRecord = readRows,
          totalExecutionTime = System.currentTimeMillis() - startTime,
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
        pullData()
        batchNumber += 1

        if (batchNumber % reportEveryNBatch == 1) {
          reportStatus()
        }
      } catch {
        case e: Throwable =>
          error(s"error when sync, last synced value: $lastSyncedValue", e)
      }
    }

    reader.closeConnection()
    writers.foreach(_.close())

    val finalStatus: JobStatus =
      if (isRunning.get()) {
        JobStatus.Synced
      } else {
        JobStatus.Terminated
      }

    baseProgress.copy(
      jobStatus = finalStatus,
      updatedTime = System.currentTimeMillis(),
      totalSyncRecord = readRows,
      totalExecutionTime = System.currentTimeMillis() - startTime,
      lastSyncedValue = lastSyncedValue
    )
  }

  private def getDestTableSchema(organizationId: Long, dbName: String, tblName: String): Option[TableSchema] = {
    var retry: Int = ZConfig.getInt("bq_storage_worker.get_dest_database_schema.retry_time", 3)
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

  override def mergeTableSchema(sourceTable: TableSchema, destTableOption: Option[TableSchema]): TableSchema = {
    destTableOption match {
      case None => sourceTable
      case Some(oldTable) =>
        val newColumns: Seq[Column] = updateColumnsMetadata(sourceTable.columns, oldTable.columns)
        oldTable.copy(columns = newColumns)
    }
  }

  private def updateColumnsMetadata(newColumns: Seq[Column], oldColumns: Seq[Column]): Seq[Column] = {
    newColumns.map(newColumn => {
      oldColumns.find(_.name.equals(newColumn.name)) match {
        case None            => newColumn
        case Some(oldColumn) => oldColumn
      }
    })
  }

}
