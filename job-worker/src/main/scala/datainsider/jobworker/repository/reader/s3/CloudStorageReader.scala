package datainsider.jobworker.repository.reader.s3

import com.amazonaws.services.s3.AmazonS3
import com.amazonaws.services.s3.model.{GetObjectRequest, ObjectListing, S3Object, S3ObjectSummary}
import com.twitter.inject.Logging
import datainsider.client.exception.BadRequestError
import datainsider.common.profiler.Profiler
import datainsider.jobworker.domain.CompressType
import datainsider.jobworker.util.{FileDecompressUtils, Using, ZConfig}
import org.apache.commons.io.FilenameUtils

import java.io.{File, FileOutputStream}
import scala.collection.JavaConverters._
import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global

trait CloudStorageReader {

  /**
    * Amazon còn file không
    * @return
    */
  def hasNext(): Boolean

  /**
    * Get next file
    * @return
    */
  def next(): File

  def close(): Unit
}

class S3StorageReader(s3Client: AmazonS3, s3Config: S3Config, numSampleBytes: Option[Long])
    extends CloudStorageReader
    with Logging {

  private val baseDir: String = ZConfig.getString("amazon_s3_worker.base_dir")

  private val fileQueue = new mutable.Queue[File]()
  private val downloadKeyQueue = new mutable.Queue[String]()

  fetchPages()

  override def hasNext(): Boolean =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::hasNext") {
      fileQueue.nonEmpty || downloadKeyQueue.nonEmpty
    }

  override def next(): File =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::next") {
      if (fileQueue.isEmpty) {
        nextFile()
      }
      fileQueue.dequeue()
    }

  private def nextFile(): Unit =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::nextFile") {
      if (downloadKeyQueue.nonEmpty) {
        val file: File = downloadFile(s3Client, s3Config.bucketName, downloadKeyQueue.dequeue())
        fileQueue.enqueue(decompressedFile(file.getAbsolutePath): _*)
      } else {
        throw BadRequestError(s"There is no file left for $s3Config")
      }
    }

  private def fetchPages(): Unit =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::fetchPages") {
      var paging: ObjectListing = s3Client.listObjects(s3Config.bucketName)
      var totalSize: Long = 0
      var numFiles: Int = 0
      val startTime: Long = System.currentTimeMillis()

      do {
        val objectSummaries: Seq[S3ObjectSummary] = getAmazonS3Keys(paging, s3Config)

        totalSize += objectSummaries.map(_.getSize).sum
        numFiles += objectSummaries.size

        downloadKeyQueue.enqueue(objectSummaries.map(_.getKey): _*)

        // if this is a preview session, then don't need to fetch all files, just need at least 1 file to preview
        if (numSampleBytes.isDefined && downloadKeyQueue.nonEmpty) {
          return
        }

        paging = s3Client.listNextBatchOfObjects(paging)
      } while (paging.isTruncated)

      info(
        s"finish fetching s3 files for $s3Config in ${System.currentTimeMillis() - startTime} ms, found $numFiles files with total size of $totalSize bytes"
      )

    }

  private def getAmazonS3Keys(objectListing: ObjectListing, s3Config: S3Config): Seq[S3ObjectSummary] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getAmazonS3Keys") {
      objectListing.getObjectSummaries.asScala
        .filter(objectSummary => {
          val key: String = objectSummary.getKey
          val lastModified: Long = objectSummary.getLastModified.getTime
          val isKeyFolderValid: Boolean = validateS3KeyFolder(key, s3Config.folderPath)
          val isLastModifiedValid: Boolean = validateLastModified(s3Config, lastModified)
          val isFile: Boolean = !key.endsWith("/")
          isKeyFolderValid && isLastModifiedValid && isFile
        })
    }

  private def validateS3KeyFolder(key: String, folderPath: String): Boolean = {
    key.startsWith(folderPath)
  }

  private def validateLastModified(s3Config: S3Config, lastModified: Long): Boolean = {
    s3Config.incrementalSyncTime < lastModified
  }

  private def downloadFile(s3Client: AmazonS3, bucketName: String, key: String): File =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::downloadFile") {
      val getObjectRequest = new GetObjectRequest(bucketName, key)
      if (numSampleBytes.isDefined) {
        getObjectRequest.withRange(0, numSampleBytes.get)
      }

      val s3Object: S3Object = s3Client.getObject(getObjectRequest)

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

  private def decompressedFile(filePath: String): Seq[File] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::decompressedFile") {
      val fileExtension: String = FilenameUtils.getExtension(filePath)
      val outputFile = if (CompressType.isCompressed(fileExtension)) {
        try {
          FileDecompressUtils.decompressFile(filePath)
        } finally {
          new File(filePath).delete()
        }
      } else {
        filePath
      }

      getNestedFiles(new File(outputFile))
    }

  private def getNestedFiles(file: File): Seq[File] = {
    if (file.isDirectory) {
      file.listFiles().flatMap(nestedFile => getNestedFiles(nestedFile)).toSeq
    } else {
      Seq(file)
    }
  }

  override def close(): Unit =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::close") {
      s3Client.shutdown()
      while (fileQueue.nonEmpty) {
        fileQueue.dequeue().delete()
      }
    }
}
