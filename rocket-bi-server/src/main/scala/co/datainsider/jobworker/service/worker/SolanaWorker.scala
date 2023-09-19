package co.datainsider.jobworker.service.worker

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.job.SolanaJob
import co.datainsider.jobworker.domain.source.SolanaSource
import co.datainsider.jobworker.domain.{JobProgress, JobStatus, SolanaProgress}
import co.datainsider.jobworker.repository.reader.{SolanaReader, SolanaReaderImpl}
import co.datainsider.jobworker.repository.writer.DataWriter
import co.datainsider.jobworker.repository.{SkippedBlockException, SolanaClient, SolanaClientImpl}
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.jobworker.util.StringUtils.RichOptionConvert
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.TableSchema
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import education.x.commons.KVS

import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.ExecutionContext.Implicits.global

class SolanaWorker(
    source: SolanaSource,
    schemaService: SchemaClientService,
    jobInQueue: KVS[Long, Boolean],
    maxBufferSize: Int,
    engine: Engine[Connection],
    connection: Connection
) extends JobWorker[SolanaJob]
    with Logging {

  val isRunning: AtomicBoolean = new AtomicBoolean(true)

  override def run(job: SolanaJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    logger.info(s"${Thread.currentThread().getName}: begin job: $job, source: ${source}")
    try {
      sync(job, syncId, onProgress)
    } catch {
      case ex: Throwable =>
        error(s"run:: job error ${ex.getMessage}", ex)
        SolanaProgress(
          job.orgId,
          syncId,
          job.jobId,
          System.currentTimeMillis(),
          JobStatus.Error,
          0,
          0,
          job.lastSyncedValue,
          Some(ex.getMessage)
        )
    } finally {
      jobInQueue.remove(syncId)
    }
  }

  private def write(writers: Seq[DataWriter], records: Seq[Record], tableSchema: TableSchema): Unit = {
    writers.foreach(_.insertBatch(records, tableSchema))
  }

  def sync(job: SolanaJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    logger.info(s"sync:: ${Thread.currentThread().getName}")
    val startTime: Long = System.currentTimeMillis()
    var lastSyncedValue: String = job.lastSyncedValue

    val jobProgress = SolanaProgress(
      job.orgId,
      syncId,
      job.jobId,
      System.currentTimeMillis(),
      JobStatus.Syncing,
      0,
      System.currentTimeMillis() - startTime,
      lastSyncedValue
    )
    onProgress(jobProgress)

    val reader = getSolanaReader(source, job)
    logger.info(s"sync::init reader ${Thread.currentThread().getName}")

    var rowInserted: Long = 0L

    logger.info(s"sync::ensure schema start")

    val blockTableSchema = reader.getBlockTableSchema(job.destDatabaseName, job.destTableName)
    schemaService.createOrMergeTableSchema(blockTableSchema).sync()

    val transactionTableSchema = reader.getTransactionTableSchema(job.destDatabaseName, job.destTransactionTable)
    schemaService.createOrMergeTableSchema(transactionTableSchema).sync()

    val rewardTableSchema = reader.getRewardTableSchema(job.destDatabaseName, job.destRewardTable)
    schemaService.createOrMergeTableSchema(rewardTableSchema).sync()

    logger.info(s"sync::start ingest data")

    def reportStatus(): Unit = {
      // report sync status to job-scheduler
      val batchSyncedSucceed: JobProgress = jobProgress.copy(
        updatedTime = System.currentTimeMillis(),
        totalSyncRecord = rowInserted,
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

    val blockWriters: Seq[DataWriter] = Seq(engine.createWriter(connection))
    val transactionWriters: Seq[DataWriter] = Seq(engine.createWriter(connection))
    val rewardWriters: Seq[DataWriter] = Seq(engine.createWriter(connection))

    logger.info(s"sync::read data")
    while (isRunning.get() && reader.hasNext()) {
      try {
        reader.next()
        write(blockWriters, Seq(reader.getBlockRecord()), blockTableSchema)
        write(transactionWriters, reader.getTransactionRecords(), transactionTableSchema)
        write(rewardWriters, reader.getRewardRecords(), rewardTableSchema)
        lastSyncedValue = reader.getCurrentSlot().toString
        rowInserted += 1
        reportStatus()

      } catch {
        case ex: SkippedBlockException => info(s"skip block ${ex.slot}")
      }
    }

    logger.info(s"sync::read completed")

    blockWriters.foreach(_.close())
    transactionWriters.foreach(_.close())
    rewardWriters.foreach(_.close())

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
      totalExecutionTime = System.currentTimeMillis() - startTime,
      lastSyncedValue = lastSyncedValue
    )
  }

  def getSolanaReader(source: SolanaSource, job: SolanaJob): SolanaReader = {
    logger.info(s"create solana client endpoint ${source.entrypoint}")
    val client: SolanaClient = new SolanaClientImpl(source.entrypoint, job.retryTime)
    logger.info(s"create solana client with endpoint ${source.entrypoint} completed")
    val startValue: Long = job.lastSyncedValue.toLongOption().getOrElse(0L)
    logger.info(s"create reader with start value ${startValue}")
    return new SolanaReaderImpl(job.orgId, client, startValue)
  }

}
