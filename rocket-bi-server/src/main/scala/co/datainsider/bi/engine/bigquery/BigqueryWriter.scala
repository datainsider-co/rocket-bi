package co.datainsider.bi.engine.bigquery

import co.datainsider.bi.client.BigQueryClient
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.TimeUtils
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.jobworker.exception.FinishingDataWriterException
import co.datainsider.jobworker.repository.writer.{
  DataWriter,
  LocalFileWriter,
  LocalFileWriterConfig,
  LocalFileWriterImpl
}
import co.datainsider.jobworker.util.JsonUtils
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import com.twitter.inject.Logging
import datainsider.client.exception.DbExecuteError
import datainsider.client.util.Using

import java.io.File
import java.lang.Thread.UncaughtExceptionHandler
import java.util.concurrent.atomic.AtomicBoolean
import scala.collection.mutable.ArrayBuffer
import scala.io.Source
import scala.language.postfixOps
import scala.util.Try

class BigqueryWriter(bigquery: BigQueryClient, fileWriterConfig: LocalFileWriterConfig, sleepIntervalMs: Int = 10000)
    extends DataWriter
    with Logging {

  val isPullDataFinished: AtomicBoolean = new AtomicBoolean(false)
  val fileWriter: LocalFileWriter = new LocalFileWriterImpl(fileWriterConfig)

  /**
    * contains all exceptions that occurred in bigqueryConsumerThread thread
    */
  private val exceptions = ArrayBuffer.empty[Throwable]

  private val bigqueryConsumerThread = new Thread(() => {
    while (!isPullDataFinished.get() || fileWriter.currentQueueSize() != 0) {
      fileWriter.getFinishedFile match {
        case Some(filePath) =>
          try {
            processFile(filePath)
          } catch {
            case ex: Throwable => {
              exceptions.append(ex)
              logger.error(s"${this.getClass.getSimpleName}::consume to bigquery failed: $ex")
            }
          } finally {
            deleteFile(filePath)
          }
        case None =>
          Thread.sleep(sleepIntervalMs)
      }
    }
  })

  bigqueryConsumerThread.setUncaughtExceptionHandler(new UncaughtExceptionHandler {
    override def uncaughtException(thread: Thread, ex: Throwable): Unit = {
      logger.error(s"uncaughtException:: Thread ${thread.getName} got exception: ${ex.getMessage}")
      exceptions.append(ex)
      bigqueryConsumerThread.start()
      logger.info(s"uncaughtException:: Thread ${thread.getName} restart successfully")
    }
  })
  bigqueryConsumerThread.start()

  @throws[DbExecuteError]("when insert data to bigquery failed")
  private def processFile(filePath: String): Unit =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::processFile") {
      info(s"${this.getClass.getSimpleName}::processFile import to bigquery file: $filePath")
      val tblSchema: TableSchema = getTableSchema(filePath)
      // skip first line because it is schema
      bigquery.loadJsonFile(filePath, tblSchema.dbName, tblSchema.name, skipNRow = 1)
    }

  /**
    * write records to local file
    * local files that is full will push to queue
    * a consumer will take data from queue to write to bigquery
    * @param records list of rows to be inserted
    * @param destSchema schema of destination table to parse data
    *  @return number of row inserted
    */
  override def insertBatch(records: Seq[Record], destSchema: TableSchema): Int =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::write") {
      val lines: Seq[String] = BigQueryUtils.toLines(records, destSchema)
      fileWriter.writeLines(lines, destSchema)
    }

  private def getTableSchema(filePath: String): TableSchema = {
    val file = new File(filePath)
    val firstLine = Using(Source.fromFile(file))(_.getLines().next())
    JsonUtils.fromJson[TableSchema](firstLine)
  }

  def deleteFile(filePath: String): Unit =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::deleteFile") {
      try {
        val file = new File(filePath)
        file.delete()
      } catch {
        case _: Throwable => error(s"got error when delete temp local file: $filePath")
      }
    }

  /** *
    * Finish write data
    * Add current file to queue. Wait for write all data success or get error
    * @return
    */
  override def close(): Unit =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::close") {
      isPullDataFinished.set(true)
      fileWriter.flushUnfinishedFiles()
      bigqueryConsumerThread.join()
      ensureNoError()
    }

  private def ensureNoError(): Unit = {
    if (exceptions.nonEmpty) {
      throw FinishingDataWriterException("got error when write data to bigquery", exceptions)
    }
  }
}
