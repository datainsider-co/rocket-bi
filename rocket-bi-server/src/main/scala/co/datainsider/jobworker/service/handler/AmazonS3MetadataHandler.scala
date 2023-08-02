package co.datainsider.jobworker.service.handler

import co.datainsider.jobworker.domain.{CsvConfig, Job}
import co.datainsider.jobworker.domain.job.AmazonS3Job
import co.datainsider.jobworker.domain.response.PreviewResponse
import co.datainsider.bi.util.ZConfig
import com.amazonaws.services.s3.AmazonS3
import com.twitter.util.Future
import co.datainsider.schema.domain.TableSchema
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.jobworker.repository.reader.s3.{CloudStorageReader, S3Config, S3StorageReader}
import co.datainsider.jobworker.repository.reader.{CsvReader, FileReader}

import java.io.File
import scala.collection.JavaConverters._

class AmazonS3MetadataHandler(client: AmazonS3) extends SourceMetadataHandler {

  override def testConnection(): Future[Boolean] =
    Future {
      try {
        client.listBuckets()
        true
      } catch {
        case ex: Throwable => false
      }
    }

  override def listDatabases(): Future[Seq[String]] =
    Future {
      client.listBuckets().asScala.map(_.getName)
    }

  override def listTables(databaseName: String): Future[Seq[String]] = ???

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = ???

  override def testJob(job: Job): Future[Boolean] = ???

  def preview(s3Job: AmazonS3Job): Future[PreviewResponse] =
    Future {
      val numSampleBytes: Long = ZConfig.getLong("amazon_s3_worker.sample_bytes_for_preview", 1000000)
      val previewBatchSize: Int = ZConfig.getInt("amazon_s3_worker.preview_batch_size", 100)
      val s3Config = S3Config(bucketName = s3Job.bucketName, folderPath = s3Job.folderPath, s3Job.incrementalTime)
      val cloudStorageReader: CloudStorageReader = new S3StorageReader(client, s3Config, Some(numSampleBytes))
      val file: File = cloudStorageReader.next()

      try {
        val fileReader: FileReader =
          new CsvReader(
            file.getAbsolutePath,
            s3Job.fileConfig.asInstanceOf[CsvConfig],
            previewBatchSize
          )

        val previewSchema: TableSchema = s3Job.tableSchema.getOrElse(fileReader.detectTableSchema())
        val records: Seq[Record] = fileReader.next(previewSchema)
        PreviewResponse(tableSchema = previewSchema, records = records)
      } catch {
        case ex: Throwable => throw new InternalError(ex)
      } finally {
        cloudStorageReader.close()
      }
    }
}
