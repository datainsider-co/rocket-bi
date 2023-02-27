package datainsider.jobworker.service.worker

import com.amazonaws.ClientConfiguration
import com.amazonaws.auth.{AWSStaticCredentialsProvider, BasicAWSCredentials}
import com.amazonaws.services.s3.model.{ObjectListing, S3Object, S3ObjectSummary}
import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.schema.{DatabaseSchema, TableSchema}
import datainsider.client.exception.TableNotFoundError
import datainsider.client.service.SchemaClientService
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain._
import datainsider.jobworker.repository.writer.DataWriter
import datainsider.jobworker.util.Implicits.FutureEnhance
import datainsider.jobworker.util.StringUtils.getOriginTblName
import datainsider.jobworker.util.{FileDecompressUtils, Using, ZConfig}
import education.x.commons.SsdbKVS
import org.apache.commons.io.FilenameUtils

import java.io.{File, FileOutputStream}
import java.util.concurrent.atomic.AtomicBoolean
import scala.collection.JavaConverters._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.reflect.io.Directory

object AmazonS3Client {
  def apply(dataSource: AmazonS3Source, connectionTimeout: Int, timeToLive: Long): AmazonS3 = {

    val clientConfiguration = new ClientConfiguration()
    clientConfiguration.setConnectionTimeout(connectionTimeout)
    clientConfiguration.setConnectionTTL(timeToLive)
    val credential = new BasicAWSCredentials(dataSource.awsAccessKeyId, dataSource.awsSecretAccessKey)

    AmazonS3ClientBuilder
      .standard()
      .withCredentials(new AWSStaticCredentialsProvider(credential))
      .withRegion(dataSource.region)
      .withClientConfiguration(clientConfiguration)
      .build()
  }
}

class AmazonS3Worker(
    source: AmazonS3Source,
    schemaService: SchemaClientService,
    ssdbKVS: SsdbKVS[Long, Boolean],
    s3Client: AmazonS3,
    batchSize: Int
) extends JobWorker[AmazonS3Job]
    with Logging {

  val startTime: Long = System.currentTimeMillis()
  val isRunning: AtomicBoolean = new AtomicBoolean(true)
  val baseDir: String = ZConfig.getString("amazon_s3_worker.base_dir")

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
      val tableSchema: TableSchema =
        getDestTableSchema(job.orgId, job.destDatabaseName, getOriginTblName(job.destTableName)) match {
          case Some(tableSchema) => tableSchema
          case None              => throw TableNotFoundError(s"not found table ${job.destTableName}, please create table")
        }
      sync(tableSchema, job, syncId, report, baseProgress)
    } catch {
      case e: Throwable =>
        logger.error(s"execute job fail: $job", e)
        baseProgress.copy(
          jobStatus = JobStatus.Error,
          updatedTime = System.currentTimeMillis(),
          totalSyncRecord = 0,
          totalExecutionTime = System.currentTimeMillis() - startTime,
          incrementalTime = job.incrementalTime
        )
    } finally {
      ssdbKVS.remove(syncId)
      logger.info(s"${Thread.currentThread().getName}: finish job: $job")
    }
  }

  def sync(
      tableSchema: TableSchema,
      job: AmazonS3Job,
      syncId: SyncId,
      report: JobProgress => Future[Unit],
      baseProgress: AmazonS3Progress
  ): JobProgress = {

    val writers: Seq[DataWriter] = job.destinations.map(dest => DataWriter(dest))
    var totalRowInserted: Long = 0
    report(baseProgress)

    var objectListing: ObjectListing = s3Client.listObjects(job.bucketName)
    do {
      val amazonS3Keys: Seq[String] = getAmazonS3Keys(objectListing, job)
      amazonS3Keys.foreach(amazonS3Key => {
        val file: File = downloadFiles(s3Client, job.bucketName, amazonS3Key)
        try {
          val dataFilePath: String = decompressedFile(file.getAbsolutePath)
          val currentRowInserted: Long = ingestFile(dataFilePath, tableSchema, writers, job.fileConfig)
          totalRowInserted = totalRowInserted + currentRowInserted
        } finally {
          report(
            baseProgress.copy(
              updatedTime = System.currentTimeMillis(),
              totalSyncRecord = totalRowInserted,
              totalExecutionTime = System.currentTimeMillis() - startTime,
              incrementalTime = System.currentTimeMillis()
            )
          )
          deleteFile(file.getAbsolutePath)
        }
      })

      ssdbKVS.get(syncId).map {
        case Some(value) => isRunning.set(value)
        case None        =>
      }
      objectListing = s3Client.listNextBatchOfObjects(objectListing)
    } while (objectListing.isTruncated && isRunning.get())

    writers.foreach(_.finishing())

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

  private def getAmazonS3Keys(objectListing: ObjectListing, job: AmazonS3Job): Seq[String] = {
    objectListing.getObjectSummaries.asScala
      .filter(objectSummary => {
        val key = objectSummary.getKey
        val lastModified = objectSummary.getLastModified.getTime
        val isKeyFolderValid: Boolean = validateS3KeyFolder(key, job.folderPath)
        val isLastModifiedValid: Boolean = validateLastModified(job, lastModified)
        val isFile: Boolean = !key.endsWith("/")
        isKeyFolderValid && isLastModifiedValid && isFile
      })
      .map(_.getKey)
  }

  private def ingestFile(
      filePath: String,
      tableSchema: TableSchema,
      writers: Seq[DataWriter],
      fileConfig: FileConfig
  ): Long = {
    var rowsIngested = 0
    try {
      val dataFiles: Seq[File] = getNestedFiles(new File(filePath))
      dataFiles.foreach(file => {
//        Using(FileReaderFactory(file.getAbsolutePath, fileConfig)) { reader =>
//          {
//            while (reader.hasNext) {
//              val records = reader.next(tableSchema.columns, batchSize)
//              writers.foreach(writer => writer.write(records, tableSchema))
//              rowsIngested = rowsIngested + records.length
//            }
//          }
//        }
        ???
      })
      rowsIngested
    } catch {
      case ex: Throwable =>
        error(s"can't read file $filePath, $ex")
        rowsIngested
    } finally {
      deleteFile(filePath)
    }
  }

  private def validateS3KeyFolder(key: String, folderPath: String): Boolean = {
    key.startsWith(folderPath)
  }

  private def validateLastModified(job: AmazonS3Job, lastModified: Long): Boolean = {
    job.syncMode match {
      case SyncMode.FullSync => true
      case SyncMode.IncrementalSync =>
        job.incrementalTime < lastModified
    }
  }

  private def downloadFiles(s3Client: AmazonS3, bucketName: String, key: String): File = {
    val s3Object: S3Object = s3Client.getObject(bucketName, key)

    val outputFile: File = new File(s"$baseDir/$bucketName/$key")
    outputFile.getParentFile.mkdirs()

    Using(s3Object.getObjectContent) { inputStream =>
      Using(new FileOutputStream(outputFile)) { outputStream =>
        val buf = new Array[Byte](1024)
        var readLen: Int = inputStream.read(buf)
        while (readLen > 0) {
          outputStream.write(buf, 0, readLen)
          readLen = inputStream.read(buf)
        }
      }
    }

    outputFile
  }

  private def decompressedFile(filePath: String): String = {
    val fileExtension: String = FilenameUtils.getExtension(filePath)
    if (CompressType.isCompressed(fileExtension)) {
      FileDecompressUtils.decompressFile(filePath)
    } else {
      filePath
    }
  }

  private def getNestedFiles(file: File): Seq[File] = {
    if (file.isDirectory) {
      file.listFiles().flatMap(nestedFile => getNestedFiles(nestedFile)).toSeq
    } else {
      Seq(file)
    }
  }

  private def deleteFile(filePath: String): Unit = {
    try {
      val file: File = new File(filePath)
      if (file.isDirectory) {
        new Directory(file).deleteRecursively()
      } else {
        file.delete()
      }
    }
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
        case ex: Throwable => error(s"got fail to get dest table, ${ex.getMessage}")
      }
      retry = retry - 1
    }
    tableSchema
  }
}
