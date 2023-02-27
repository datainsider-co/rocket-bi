package datainsider.jobworker.service.worker

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.column.Column
import datainsider.client.domain.schema.{DatabaseSchema, TableSchema, TableStatus}
import datainsider.client.exception.DbExecuteError
import datainsider.client.service.SchemaClientService
import datainsider.client.util.ZConfig
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain._
import datainsider.jobworker.repository.JdbcReader
import datainsider.jobworker.repository.writer.DataWriter
import datainsider.jobworker.util.Implicits.FutureEnhance
import datainsider.jobworker.util.StringUtils.getOriginTblName
import education.x.commons.SsdbKVS

import java.lang.Thread.UncaughtExceptionHandler
import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.ExecutionContext.Implicits.global

class JdbcWorker(
    source: JdbcSource,
    schemaService: SchemaClientService,
    ssdbKVS: SsdbKVS[Long, Boolean]
) extends JobWorker[JdbcJob]
    with Logging {

  val isRunning: AtomicBoolean = new AtomicBoolean(true)

  override def run(job: JdbcJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    logger.info(s"${Thread.currentThread().getName}: begin job: $job")
    try {
      sync(job, syncId, onProgress)
    } catch {
      case e: Throwable =>
        val error: JobProgress =
          JdbcProgress(
            job.orgId,
            syncId,
            job.jobId,
            currentTimestamp,
            JobStatus.Error,
            0,
            0,
            job.lastSyncedValue,
            Some(e.getMessage)
          )
        logger.error(s"execute job fail: $job", e)
        error
    } finally {
      ssdbKVS.remove(syncId)
      logger.info(s"${Thread.currentThread().getName}: finish job: $job")
    }
  }

  private def sync(job: JdbcJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    val batchSize = ZConfig.getInt("jdbc_worker.sync_batch_size", 1000).max(job.maxFetchSize)
    val reportBatchNumber = ZConfig.getInt("jdbc_worker.report_batch_number", 100)

    val reader: JdbcReader = JdbcReader(source, job, batchSize)
    val oldTableSchema: Option[TableSchema] =
      getDestTableSchema(job.orgId, job.destDatabaseName, getOriginTblName(job.destTableName))
    val sourceTblSchema: TableSchema = mergeTableSchema(reader.getTableSchema, oldTableSchema)

    // init table schema in destinations
    // don't use lazy val, because it will not be execute if reader.hasNext = false
    val destTblSchema: TableSchema =
      ensureDestSchema(
        job.orgId,
        sourceTblSchema,
        job.destinations,
        job.destDatabaseName,
        job.destTableName
      )
    val writers: Seq[DataWriter] = job.destinations.map(dest => DataWriter(dest))

    var lastSyncedValue: String = job.lastSyncedValue

    val reportInterval = batchSize * reportBatchNumber // report every n batches
    val beginTime = currentTimestamp
    val jobProgress =
      JdbcProgress(
        job.orgId,
        syncId,
        job.jobId,
        beginTime,
        JobStatus.Syncing,
        0,
        currentTimestamp - beginTime,
        job.lastSyncedValue
      )
    onProgress(jobProgress)

    var rowInserted: Int = 0

    while (reader.hasNext && isRunning.get()) {
      ssdbKVS.get(syncId).map {
        case Some(value) => isRunning.set(value)
        case None        =>
      }

      try {
        val records: Seq[Record] = reader.next

        writers.foreach(writer => {
          if (records.nonEmpty) try {
            writer.write(records, destTblSchema)
          } catch {
            case e: Throwable => error(s"${writer.getClass} write ${records.length} records failed, reason: $e")
          }
        })

        rowInserted += records.length
        lastSyncedValue = reader.getLastSyncedValue

        if (rowInserted % reportInterval == 0) {
          val batchSyncedSucceed: JobProgress = jobProgress.copy(
            updatedTime = currentTimestamp,
            totalSyncRecord = rowInserted,
            totalExecutionTime = currentTimestamp - beginTime,
            lastSyncedValue = lastSyncedValue
          )
          onProgress(batchSyncedSucceed)
        }
      } catch {
        case e: Throwable =>
          val error: JobProgress =
            JdbcProgress(
              job.orgId,
              syncId,
              job.jobId,
              currentTimestamp,
              JobStatus.Error,
              rowInserted,
              currentTimestamp - beginTime,
              job.lastSyncedValue,
              Some(e.getMessage)
            )
          onProgress(error)
          throw DbExecuteError(s"error when sync, last synced value: $lastSyncedValue", e)
      }
    }

    reader.closeConnection()
    writers.foreach(_.finishing())

    val finalStatus: JobStatus =
      if (isRunning.get()) {
        JobStatus.Synced
      } else {
        JobStatus.Terminated
      }

    jobProgress.copy( // sync succeed
      jobStatus = finalStatus,
      updatedTime = currentTimestamp,
      totalSyncRecord = rowInserted,
      totalExecutionTime = currentTimestamp - beginTime,
      lastSyncedValue = lastSyncedValue
    )
  }

  /**
    * ensure destination table schema is compatible with source  table schema
    * dynamically add new columns if source table has new columns
    * @param orgId organization id
    * @param srcTableSchema schema of source table
    * @param destDbName name of destination db
    * @param destTblName name of destination table
    * @return
    */
  private def ensureDestSchema(
      orgId: Long,
      srcTableSchema: TableSchema,
      destinations: Seq[DataDestination],
      destDbName: String,
      destTblName: String
  ): TableSchema = {

    val destTableSchema = srcTableSchema.copy(
      dbName = if (destDbName.nonEmpty) destDbName else srcTableSchema.dbName,
      name = if (destTblName.nonEmpty) destTblName else srcTableSchema.name,
      organizationId = orgId,
      displayName = srcTableSchema.displayName
    )

    destinations.foreach {
      case DataDestination.Clickhouse =>
        schemaService.createOrMergeTableSchema(destTableSchema).sync()
      case DataDestination.Hadoop =>
    }

    destTableSchema
  }

  private def getDestTableSchema(organizationId: Long, dbName: String, tblName: String): Option[TableSchema] = {
    var retry: Int = ZConfig.getInt("jdbc_worker.get_dest_database_schema.retry_time", 3)
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

  private def currentTimestamp: Long = System.currentTimeMillis()

}
