package datainsider.jobworker.repository.reader

import datainsider.client.domain.schema.TableSchema
import datainsider.client.exception.InternalError
import datainsider.common.profiler.Profiler
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.CsvConfig
import datainsider.jobworker.repository.reader.s3.CloudStorageReader

import java.io.File
import scala.concurrent.ExecutionContext.Implicits.global

class S3CsvReader(
    s3Reader: CloudStorageReader,
    csvConfig: CsvConfig,
    batchSize: Int
) extends FileReader {

  private var csvReader: CsvReader = createNextFileReader()
  lazy val csvSchema: TableSchema = csvReader.detectTableSchema

  override def detectTableSchema(): TableSchema =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::detectTableSchema") {
      csvReader.csvSchema
    }

  override def hasNext(): Boolean =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::hasNext") {
      csvReader.hasNext || s3Reader.hasNext
    }

  override def next(destSchema: TableSchema): Seq[Record] =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::next") {
      if (csvReader.hasNext()) {
        csvReader.next(destSchema)
      } else {
        cleanUpReader(csvReader)
        csvReader = createNextFileReader()
        csvReader.next(destSchema)
      }
    }

  override def getFile: File =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::getFile") {
      csvReader.getFile
    }

  override def close(): Unit =
    Profiler(s"[DataReader] ${this.getClass.getSimpleName}::close") {
      cleanUpReader(csvReader)
      s3Reader.close()
    }

  private def createNextFileReader(): CsvReader = {
    if (s3Reader.hasNext()) {
      val nextFile: File = s3Reader.next()
      new CsvReader(nextFile.getAbsolutePath, csvConfig, batchSize)
    } else {
      throw InternalError("No file found.")
    }
  }

  private def cleanUpReader(fileReader: FileReader): Unit = {
    if (fileReader != null) {
      fileReader.close()
      fileReader.getFile.delete()
    }
  }
}
