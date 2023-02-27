package datainsider.jobworker.service.worker2
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.Column
import datainsider.client.service.SchemaClientService
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.response.SyncInfo
import datainsider.jobworker.domain.{JobStatus, MockDataSource}
import datainsider.jobworker.exception.AlreadyCompletedException
import datainsider.jobworker.repository.reader.Reader
import datainsider.jobworker.repository.reader.factory.ReaderResolver
import datainsider.jobworker.service.worker.{DepotAssistant, MultiDepotAssistant}
import datainsider.jobworker.util.Using

import java.util.concurrent.atomic.{AtomicBoolean, AtomicLong}
import scala.collection.mutable.ArrayBuffer
import scala.util.control.NonFatal

class IncrementalJobWorker(
    schemaService: SchemaClientService,
    readerResolver: ReaderResolver,
    writeBatchSize: Int = 1000,
    reportIntervalSize: Int = 10000,
    retryTime: Int = 3,
    sleepRetryTimeMs: Int = 1000
) extends JobWorker2
    with Logging {
  private val isJobRunning = new AtomicBoolean(false)

  override def run(
      syncInfo: SyncInfo,
      ensureRunning: () => Future[Unit],
      onReportProgress: (JobWorkerProgress) => Future[Unit]
  ): JobWorkerProgress = {
    val jobProgress: JobWorkerProgress = JobWorkerProgress.default()
    try {
      logger.info(s"${Thread.currentThread().getName}: begin sync info ${syncInfo}")
      // require job is not running
      if (isJobRunning.getAndSet(true) == false) {
        initWorker(jobProgress, syncInfo, onReportProgress)
        Using(readerResolver.resolve(syncInfo.source.getOrElse(MockDataSource()), syncInfo.job))(reader => {
          val destinationTable: Option[TableSchema] =
            getTableSchema(syncInfo.job.orgId, syncInfo.job.destDatabaseName, syncInfo.job.destTableName)
          val tableSchema: TableSchema = mergeTableSchema(reader.detectTableSchema(), destinationTable)
          Using(MultiDepotAssistant(schemaService, syncInfo.job.destinations, tableSchema = tableSchema))(
            depotAssistant => {
              sync(syncInfo, tableSchema, reader, depotAssistant, jobProgress, ensureRunning, onReportProgress)
              updateLastSyncValue(jobProgress, reader)
            }
          )
        })
        jobProgress.addMessage(s"Finish sync job")
        jobProgress.setStatus(JobStatus.Synced)
        onReportProgress(jobProgress).syncGet()
        jobProgress
      } else {
        JobWorkerProgress(
          status = JobStatus.Error,
          messages = ArrayBuffer("run job fail cause job is running"),
          totalSyncedRows = new AtomicLong(),
          lastSyncedValue = ""
        )
      }
    } catch {
      case _: InterruptedException => {
        logger.info(s"${Thread.currentThread().getName}: interrupted")
        jobProgress.addMessage(s"Terminated job")
        jobProgress.setStatus(JobStatus.Terminated)
        jobProgress
      }
      case NonFatal(ex) => {
        logger.error(s"${Thread.currentThread().getName}: error when sync id ${syncInfo.syncId}", ex)
        jobProgress.addMessage(
          s"Error when sync job, cause ${ex.getMessage}"
        )
        jobProgress.setStatus(JobStatus.Error)
        jobProgress
      }
    } finally {
      isJobRunning.set(false)
      logger.info(s"${Thread.currentThread().getName}: end sync id: ${syncInfo.syncId}")
    }
  }

  private def initWorker(
      jobProgress: JobWorkerProgress,
      syncInfo: SyncInfo,
      onReportProgress: JobWorkerProgress => Future[Unit]
  ): Unit = {
    isJobRunning.set(true)
    jobProgress.addMessage(s"Start sync job ${syncInfo.getDebugData()}")
    onReportProgress(jobProgress).syncGet()
  }

  private def getTableSchema(orgId: Long, dbName: String, tblName: String): Option[TableSchema] = {
    for (i <- 0 until retryTime) {
      try {
        logger.info(s"get destination table in ${i + 1} time")
        return Option(schemaService.getTable(orgId, dbName, tblName).syncGet())
      } catch {
        case NonFatal(ex) => {
          logger.info(s"${Thread.currentThread().getName}: error when get destination table $dbName.$tblName", ex)
          Thread.sleep(sleepRetryTimeMs)
        }
      }
    }
    None
  }

  /**
    * get destination table schema from source table schema. If old table schema is existed, merge it
    */
  protected def mergeTableSchema(sourceTable: TableSchema, destinationTable: Option[TableSchema]): TableSchema = {
    destinationTable match {
      case _ => sourceTable
      case Some(destTableSchema) => {
        val newColumns: Seq[Column] = mergeColumns(sourceTable.columns, destTableSchema.columns)
        destTableSchema.copy(name = sourceTable.name, columns = newColumns)
      }
    }
  }

  private def mergeColumns(sourceColumns: Seq[Column], destColumns: Seq[Column]): Seq[Column] = {
    val newColumns = sourceColumns.filter(sourceColumn => !destColumns.exists(_.name.equals(sourceColumn.name)))
    destColumns ++ newColumns
  }

  @throws[InterruptedException]("if interrupted")
  def sync(
      syncInfo: SyncInfo,
      tableSchema: TableSchema,
      reader: Reader,
      depotAssistant: DepotAssistant,
      jobProgress: JobWorkerProgress,
      ensureRunning: () => Future[Unit],
      onReportProgress: (JobWorkerProgress) => Future[Unit]
  ): Unit = {
    var records: ArrayBuffer[Record] = ArrayBuffer.empty[Record]
    var syncedRows: Long = 0
    val isReadNext: AtomicBoolean = new AtomicBoolean(true)
    while (isJobRunning.get() && reader.hasNext() && isReadNext.get()) {
      try {
        val record: Record = reader.next(tableSchema.columns)
        records += record
        if (records.size >= writeBatchSize) {
          depotAssistant.put(records)
          syncedRows += records.size
          records = ArrayBuffer.empty[Record]
          if (syncedRows % reportIntervalSize == 0) {
            jobProgress.totalSyncedRows.set(syncedRows)
            onReportProgress(jobProgress).syncGet()
          }
        }

        ensureRunning().syncGet()
      } catch {
        case ex: AlreadyCompletedException => {
          logger.warn(s"${Thread.currentThread().getName}: reader is completed", ex)
          isReadNext.set(false)
        }
      }
    }
    if (records.nonEmpty) {
      depotAssistant.put(records)
      syncedRows += records.size
      jobProgress.totalSyncedRows.set(syncedRows)
      onReportProgress(jobProgress).syncGet()
    }
  }

  private def updateLastSyncValue(jobProgress: JobWorkerProgress, reader: Reader): Unit = {
    if (reader.isIncrementalMode() && reader.getLastSyncValue().isDefined) {
      jobProgress.setLastSyncValue(reader.getLastSyncValue().get)
    }
  }
}
