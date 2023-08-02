package co.datainsider.jobworker.service.worker

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.domain.job.AmazonS3Job
import co.datainsider.jobworker.domain.source.AmazonS3Source
import co.datainsider.jobworker.repository.reader.S3CsvReader
import co.datainsider.jobworker.repository.reader.s3.{CloudStorageReader, S3Config, S3StorageReader}
import co.datainsider.jobworker.repository.writer.DataWriter
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.jobworker.util.StringUtils.getOriginTblName
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema}
import com.amazonaws.services.s3.AmazonS3
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.DbExecuteError
import education.x.commons.KVS

import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.ExecutionContext.Implicits.global

class AmazonS3WorkerV2(
    source: AmazonS3Source,
    schemaService: SchemaClientService,
    jobInQueue: KVS[Long, Boolean],
    s3Client: AmazonS3,
    batchSize: Int,
    engine: Engine[Connection],
    connection: Connection
) extends JobWorker[AmazonS3Job]
    with Logging {

  val startTime: Long = System.currentTimeMillis()
  val isRunning: AtomicBoolean = new AtomicBoolean(true)
  val baseDir: String = ZConfig.getString("amazon_s3_worker.base_dir")
  val reportBatchNumber: Int = ZConfig.getInt("amazon_s3_worker.report_batch_number", 1000)
  var columnNumber: Int = 0
  var curSchema: Option[TableSchema] = None

  override def run(job: AmazonS3Job, syncId: SyncId, report: JobProgress => Future[Unit]): JobProgress = {
    val baseProgress =
      AmazonS3Progress(
        job.orgId,
        syncId,
        job.jobId,
        startTime,
        JobStatus.Syncing,
        totalSyncRecord = 0,
        System.currentTimeMillis() - startTime,
        job.incrementalTime
      )
    try {
      logger.info(s"${Thread.currentThread().getName}: begin job: $job")
      sync(job, syncId, report, baseProgress)
    } catch {
      case e: Throwable =>
        logger.error(s"execute job fail: $job", e)
        baseProgress.copy(
          jobStatus = JobStatus.Error,
          updatedTime = System.currentTimeMillis(),
          totalSyncRecord = 0,
          totalExecutionTime = System.currentTimeMillis() - startTime,
          incrementalTime = job.incrementalTime,
          message = Some(e.getMessage)
        )
    } finally {
      jobInQueue.remove(syncId)
      logger.info(s"${Thread.currentThread().getName}: finish job: $job")
    }
  }

  def sync(
      job: AmazonS3Job,
      syncId: SyncId,
      report: JobProgress => Future[Unit],
      baseProgress: AmazonS3Progress
  ): JobProgress = {
    report(baseProgress)

    val s3Config = S3Config(bucketName = job.bucketName, folderPath = job.folderPath, job.incrementalTime)
    val csvConfig = job.fileConfig.asInstanceOf[CsvConfig]

    curSchema = getDestTableSchema(job.orgId, job.destDatabaseName, getOriginTblName(job.destTableName))

    val s3Reader: CloudStorageReader = new S3StorageReader(s3Client, s3Config, None)
    val s3CsvReader: S3CsvReader = new S3CsvReader(s3Reader, csvConfig, batchSize)

    val writers: Seq[DataWriter] = Seq(engine.createWriter(connection))
    var totalRowInserted: Long = 0
    var curBatchNumber: Int = 0

    while (s3CsvReader.hasNext && isRunning.get()) {
      try {
        {
          val currentCsvSchema: TableSchema = s3CsvReader
            .detectTableSchema()
            .copy(
              organizationId = job.orgId,
              dbName = job.destDatabaseName,
              name = job.destTableName
            )

          val finalSchema: TableSchema = mergeTableSchema(currentCsvSchema, curSchema)
          curSchema = Some(finalSchema)
          schemaService.createOrMergeTableSchema(finalSchema).sync()

          val records: Seq[Record] = s3CsvReader.next(finalSchema)
          writers.foreach(writer => writer.write(records, finalSchema))
          totalRowInserted += records.length

          curBatchNumber += 1
          if (curBatchNumber % reportBatchNumber == 0) {
            report(
              baseProgress.copy(
                updatedTime = System.currentTimeMillis(),
                totalSyncRecord = totalRowInserted,
                totalExecutionTime = System.currentTimeMillis() - startTime
              )
            )
          }

          jobInQueue.get(syncId).map {
            case Some(value) => isRunning.set(value)
            case None        =>
          }
        }
      } catch {
        case e: DbExecuteError => throw e
        case e: Throwable      => error(s"error when sync s3, current rows processed: $totalRowInserted", e)
      }
    }

    s3CsvReader.close()
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
      totalSyncRecord = totalRowInserted,
      totalExecutionTime = System.currentTimeMillis() - startTime,
      incrementalTime = System.currentTimeMillis()
    )
  }

  private def getDestTableSchema(organizationId: Long, dbName: String, tblName: String): Option[TableSchema] = {
    var retry: Int = ZConfig.getInt("amazon_s3_worker.get_dest_database_schema.retry_time", 3)
    var tableSchema: Option[TableSchema] = None
    var isRunning: Boolean = true
    while ((retry > 0) && isRunning) {
      try {
        val databaseSchema: DatabaseSchema = schemaService.getDatabaseSchema(organizationId, dbName).sync()
        tableSchema = databaseSchema.findTableAsOption(tblName)
        isRunning = false
      } catch {
        case ex: Throwable =>
          error(s"${this.getClass.getSimpleName}::getDestTableSchema fail with exception: ${ex.getMessage}")
      }
      retry = retry - 1
    }
    tableSchema
  }
}
