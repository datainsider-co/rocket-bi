package datainsider.jobworker.service.worker

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.service.SchemaClientService
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain._
import datainsider.jobworker.repository.{SkippedBlockException, SolanaClient, SolanaClientImpl}
import datainsider.jobworker.repository.reader.{SolanaReader, SolanaReaderImpl}
import datainsider.jobworker.repository.writer.DataWriter
import datainsider.jobworker.util.Implicits.FutureEnhance
import datainsider.jobworker.util.StringUtils.RichOptionConvert
import education.x.commons.SsdbKVS

import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.ExecutionContext.Implicits.global

class SolanaWorker(source: SolanaSource, schemaService: SchemaClientService, ssdbKVS: SsdbKVS[Long, Boolean], maxBufferSize: Int)
    extends JobWorker[SolanaJob]
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
      ssdbKVS.remove(syncId)
    }
  }

  private def write(writers: Seq[DataWriter], records: Seq[Record], tableSchema: TableSchema): Unit = {
    writers.foreach(_.write(records, tableSchema))
  }


  def sync(job: SolanaJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    logger.info(s"sync:: ${Thread.currentThread().getName}")

    val reader = getSolanaReader(source, job)
    logger.info(s"sync::init reader ${Thread.currentThread().getName}")

    var lastSyncedValue: String = job.lastSyncedValue
    var rowInserted: Long = 0L

    val startTime: Long = System.currentTimeMillis()
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
    logger.info(s"sync::ensure schema start")

    val blockTableSchema = reader.getBlockTableSchema(job.destDatabaseName, job.destTableName)
    ensureTableSchema(blockTableSchema, job.destinations)

    val transactionTableSchema = reader.getTransactionTableSchema(job.destDatabaseName, job.destTransactionTable)
    ensureTableSchema(transactionTableSchema, job.destinations)

    val rewardTableSchema = reader.getRewardTableSchema(job.destDatabaseName, job.destRewardTable)
    ensureTableSchema(rewardTableSchema, job.destinations)

    logger.info(s"sync::start ingest data")

    onProgress(jobProgress)

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
      ssdbKVS.get(syncId).map {
        case Some(value) => isRunning.set(value)
        case None        =>
      }
    }

    val blockWriters: Seq[DataWriter] = job.destinations.map(dest => DataWriter(dest))
    val transactionWriters: Seq[DataWriter] = job.destinations.map(dest => DataWriter(dest))
    val rewardWriters: Seq[DataWriter] = job.destinations.map(dest => DataWriter(dest))

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

    blockWriters.foreach(_.finishing())
    transactionWriters.foreach(_.finishing())
    rewardWriters.foreach(_.finishing())

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


  private def ensureTableSchema(tableSchema: TableSchema, destinations: Seq[DataDestination]): Unit = {
    logger.info(s"ensureTableSchema:: ${tableSchema}, ${destinations}")
    destinations.foreach {
      case DataDestination.Clickhouse => schemaService.createOrMergeTableSchema(tableSchema).sync()
      case DataDestination.Hadoop     =>
    }
  }

}
