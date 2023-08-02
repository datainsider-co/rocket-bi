package co.datainsider.jobworker.repository.writer

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.jobworker.util.JsonUtils
import co.datainsider.schema.domain.TableSchema
import com.twitter.inject.Logging

import java.io.File
import scala.collection.mutable

/**
  * handle logic of temporary files of ingestion job
  * - create files and append data until file reach max_file_size or exceed an amount of time
  * - return files that is ready to be synced to other services
  * - clean temporary files if error...
  */
trait LocalFileWriter {

  /**
    * write records to temporary files
    * @param records
    * @return total records were written
    */
  def writeLines(lines: Seq[String], tableSchema: TableSchema): Int

  /**
    * serve file that is ready to process by other services
    * @return file path
    */
  def getFinishedFile: Option[String]

  /**
    * mark current files as finished and ready to be served
    */
  def flushUnfinishedFiles(): Unit

  def currentQueueSize(): Int
}

class LocalFileWriterImpl(config: LocalFileWriterConfig) extends LocalFileWriter with Logging {

  private val baseDir: String = config.baseDir
  private val fileExtension: String = config.fileExtension
  private val maxFileSize: Long = config.maxFileSizeInBytes
  private  val finishedFileQueue = new mutable.Queue[String]()

  private var curFileHandler: Option[FileHandler] = None
  private var curSchema: Option[TableSchema] = None

  override def writeLines(lines: Seq[String], requiredSchema: TableSchema): Int =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::writeLine") {
      if (!isSameTableSchema(curSchema, requiredSchema)) {
        flushUnfinishedFiles()
        curSchema = Some(requiredSchema)
      }

      val fileHandler: FileHandler = getCurrentFileHandler(requiredSchema)

      if (fileHandler.getFileSize == 0) {
        fileHandler.writeLine(JsonUtils.toJson(requiredSchema, isPretty = false))
      }

      try {
        lines.foreach(line => fileHandler.writeLine(line))

        if (fileHandler.getFileSize >= maxFileSize) {
          finishedFileQueue.enqueue(fileHandler.getFilePath)
          fileHandler.closeBuffer()
          createNextFileHandler(requiredSchema)
        }

      } catch {
        case e: Throwable => error(e.getMessage)
      }
      lines.length
    }

  override def getFinishedFile: Option[String] =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::getFinishedFile") {
      if (finishedFileQueue.nonEmpty) {
        Some(finishedFileQueue.dequeue())
      } else {
        None
      }
    }

  private def getCurrentFileHandler(tableSchema: TableSchema): FileHandler =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::getFileHandler") {
      curFileHandler match {
        case Some(fileHandler) => fileHandler
        case None              => createNextFileHandler(tableSchema)
      }
    }

  private def createNextFileHandler(tableSchema: TableSchema): FileHandler =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::createFileHandler") {
      val filePath: String =
        s"$baseDir/${tableSchema.organizationId}/${tableSchema.dbName}/${tableSchema.name}/${System.currentTimeMillis()}.$fileExtension"
      val file: File = new File(filePath)
      file.getParentFile.mkdirs()

      if (!file.exists()) {
        file.createNewFile()
      }

      val fileHandler: FileHandler = new FileHandler(file)
      curFileHandler = Some(fileHandler)
      fileHandler
    }

  override def flushUnfinishedFiles(): Unit =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::flushUnfinishedFiles") {
      curFileHandler match {
        case Some(fileHandler) =>
          fileHandler.closeBuffer()
          curFileHandler = None
          finishedFileQueue.enqueue(fileHandler.getFilePath)
        case None =>
      }
    }

  override def currentQueueSize(): Int =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::currentQueueSize") {
      finishedFileQueue.size
    }

  private def isSameTableSchema(curSchema: Option[TableSchema], requiredSchema: TableSchema): Boolean = {
    curSchema match {
      case Some(schema) => schema.columns.map(_.name) == requiredSchema.columns.map(_.name)
      case None         => false
    }
  }

}
