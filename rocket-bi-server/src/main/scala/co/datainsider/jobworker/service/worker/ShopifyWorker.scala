package co.datainsider.jobworker.service.worker

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.Using
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.job.ShopifyJob
import co.datainsider.jobworker.domain.source.ShopifySource
import co.datainsider.jobworker.domain.{JobProgress, JobStatus, ShopifyJobProgress}
import co.datainsider.jobworker.repository.reader.shopify.ShopifyReader
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.TableSchema
import com.shopify.exceptions.ShopifyClientException
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.ScalaFutureLike
import education.x.commons.KVS

import scala.concurrent.ExecutionContext.Implicits.global

class ShopifyWorker(
    source: ShopifySource,
    schemaService: SchemaClientService,
    kvs: KVS[Long, Boolean],
    retryTimeoutMs: Int = 30000,
    minRetryTimeDelayMs: Int = 1000,
    maxRetryTimeDelayMs: Int = 2000,
    reportDelayMs: Int = 60000,
    engine: Engine[Connection],
    connection: Connection
) extends JobWorker[ShopifyJob]
    with Logging {
  private val NEW_LINE = "\n"
  private val startTime = System.currentTimeMillis()
  private val logMsg = new StringBuffer()

  override def run(job: ShopifyJob, syncId: SyncId, reportJob: JobProgress => Future[Unit]): ShopifyJobProgress =
    Profiler("[ShopifyWorker]:run") {
      val jobProgress = ShopifyJobProgress(
        job.orgId,
        syncId,
        job.jobId,
        System.currentTimeMillis(),
        JobStatus.Syncing,
        0,
        System.currentTimeMillis() - startTime,
        job.lastSyncedValue
      )
      try {
        logger.info(s"${Thread.currentThread().getName}: start job: $job, source: ${source}")
        logMsg.append(s"Start Shopify Job...").append(NEW_LINE)
        reportJob(jobProgress.copy(message = Some(logMsg.toString)))
        val reader: ShopifyReader =
          ShopifyReader(source, job.tableName, retryTimeoutMs, minRetryTimeDelayMs, maxRetryTimeDelayMs)
        val tableSchema: TableSchema = reader.getTableSchema(job.orgId, job.destDatabaseName, job.destTableName)
        val finished: ShopifyJobProgress =
          Using(
            MultiDepotAssistant(
              schemaService = schemaService,
              tableSchema = tableSchema,
              engines = Seq(engine),
              connections = Seq(connection)
            )
          ) { (assistant: DepotAssistant) =>
            sync(reader, job.getLastSyncedValue, syncId, jobProgress, reportJob, assistant)
          }
        finished
      } catch {
        case ex: Throwable =>
          error(s"run job ${job.jobId} failure", ex)
          logMsg.append(s"Job sync failed cause ${ex.getMessage}")
          jobProgress.copy(
            updatedTime = System.currentTimeMillis(),
            jobStatus = JobStatus.Error,
            totalExecutionTime = System.currentTimeMillis() - startTime,
            lastSyncedValue = job.lastSyncedValue,
            message = Some(logMsg.toString)
          )
      } finally {
        info(s"${Thread.currentThread().getName}: job ${job.jobId} finishing...")
        kvs.remove(syncId).asTwitter.sync()
        info(s"${Thread.currentThread().getName}: job ${job.jobId} finished")
      }
    }

  @throws[InterruptedException]
  private def ensureJobRunning(syncId: SyncId): Unit = {
    val isRunning: Boolean = kvs.get(syncId).asTwitter.sync().getOrElse(false)
    if (!isRunning) {
      info(s"${Thread.currentThread().getName} terminating ...")
      throw new InterruptedException("Job Terminated")
    }
  }

  def isOutdatedReport(latestReportMs: Long): Boolean = {
    System.currentTimeMillis() - latestReportMs > reportDelayMs
  }

  private def sync(
      reader: ShopifyReader,
      lastSyncedValue: Option[String],
      syncId: SyncId,
      jobProgress: ShopifyJobProgress,
      reportJob: JobProgress => Future[Unit],
      assistant: DepotAssistant
  ): ShopifyJobProgress =
    Profiler("[ShopifyWorker]:sync") {
      var totalInsertedRows: Long = 0L
      var currentLatestId: String = lastSyncedValue.getOrElse("")
      var latestReportMs: Long = System.currentTimeMillis()
      try {
        reader.bulkRead(lastSyncedValue) { (records: Seq[Record], latestId: String) =>
          {
            currentLatestId = latestId
            if (records.nonEmpty) {
              assistant.put(records)
              totalInsertedRows += records.length
            }
            if (isOutdatedReport(latestReportMs)) {
              latestReportMs = System.currentTimeMillis()
              reportJob(
                jobProgress.copy(
                  updatedTime = System.currentTimeMillis(),
                  totalSyncRecord = totalInsertedRows,
                  lastSyncedValue = currentLatestId,
                  totalExecutionTime = System.currentTimeMillis() - startTime
                )
              )
            }
            ensureJobRunning(syncId)
          }
        }
        logMsg.append("Completed")
        jobProgress.copy(
          jobStatus = JobStatus.Synced,
          updatedTime = System.currentTimeMillis(),
          totalSyncRecord = totalInsertedRows,
          lastSyncedValue = currentLatestId,
          totalExecutionTime = System.currentTimeMillis() - startTime,
          message = Some(logMsg.toString)
        )
      } catch {
        case ex: ShopifyClientException =>
          error(s"Job sync failure, job_id: ${jobProgress.jobId}", ex)
          logMsg.append(s"Job sync failed cause ${ex.getMessage}")
          jobProgress.copy(
            jobStatus = JobStatus.Error,
            updatedTime = System.currentTimeMillis(),
            totalSyncRecord = totalInsertedRows,
            lastSyncedValue = currentLatestId,
            totalExecutionTime = System.currentTimeMillis() - startTime,
            message = Some(logMsg.toString)
          )
        case _: InterruptedException =>
          logMsg.append(s"Job Terminated")
          jobProgress.copy(
            jobStatus = JobStatus.Terminated,
            updatedTime = System.currentTimeMillis(),
            totalSyncRecord = totalInsertedRows,
            lastSyncedValue = currentLatestId,
            totalExecutionTime = System.currentTimeMillis() - startTime,
            message = Some(logMsg.toString)
          )
      }
    }
}
