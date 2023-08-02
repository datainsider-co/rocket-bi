package co.datainsider.jobworker.repository.writer

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.jobworker.exception.FinishingDataWriterException
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
import scala.sys.process._

class FileClickhouseWriter(
    connection: ClickhouseConnection,
    fileWriterConfig: LocalFileWriterConfig,
    sleepIntervalMs: Long = 10000
) extends DataWriter
    with Logging {

  val isPullDataFinished: AtomicBoolean = new AtomicBoolean(false)
  val localFileService: LocalFileWriter = new LocalFileWriterImpl(fileWriterConfig)

  /**
    * contains all exceptions that occurred in clickhouseConsumerThread thread
    */
  private val exceptions = ArrayBuffer.empty[Throwable]

  private val clickhouseConsumerThread = new Thread(() => {
    while (!isPullDataFinished.get() || localFileService.currentQueueSize() != 0) {
      localFileService.getFinishedFile match {
        case Some(filePath) =>
          try {
            processFile(filePath)
          } catch {
            case ex: Throwable => {
              exceptions.append(ex)
              logger.error(s"${this.getClass.getSimpleName}::consume to clickhouse failed: $ex")
            }
          } finally {
//            deleteFile(filePath)
          }
        case None =>
          Thread.sleep(sleepIntervalMs)
      }
    }
  })

  clickhouseConsumerThread.setUncaughtExceptionHandler(new UncaughtExceptionHandler {
    override def uncaughtException(thread: Thread, ex: Throwable): Unit = {
      logger.error(s"uncaughtException:: Thread ${thread.getName} got exception: ${ex.getMessage}")
      exceptions.append(ex)
      clickhouseConsumerThread.start()
      logger.info(s"uncaughtException:: Thread ${thread.getName} restart successfully")
    }
  })
  clickhouseConsumerThread.start()

  @throws[DbExecuteError]("when insert data to clickhouse failed")
  private def processFile(filePath: String): Unit =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::processFile") {
      info(s"${this.getClass.getSimpleName}::processFile import to clickhouse file: $filePath")
      val tblSchema: TableSchema = getTableSchema(filePath)
      val selectedStatement = toSelectedStatement(tblSchema)
      val colNames = toColumnNames(tblSchema)
      val inputStatement = toInputStatement(tblSchema)

      val cmd = ArrayBuffer(
        "clickhouse-client",
        s"--host=${connection.host}",
        s"--port=${connection.tcpPort}",
        s"--user=${connection.username}",
        s"--query=INSERT INTO ${tblSchema.dbName}.${tblSchema.name}($colNames) SELECT $selectedStatement FROM input('$inputStatement') FORMAT JSONCompactEachRow"
      )

      if (connection.password.nonEmpty) cmd += s"--password=${connection.password}"
      if (connection.useSsl) cmd += s"--secure"

      var processLog = ""
      val processLogger = ProcessLogger(log => {
        processLog += s"\n$log"
      })
      val exitValue: Int = Process(s"tail -n +2 $filePath").#|(cmd).run(processLogger).exitValue()
      if (exitValue == 0) {
        logger.info(s"process file $filePath finish with message: $processLog")
      } else {
        logger.error(s"got error when insert data to clickhouse, log: $processLog")
        throw DbExecuteError(s"got error when insert data to clickhouse, log: $processLog")
      }
    }

  /**
    * write records to local file
    * local files that is full will push to queue
    * a consumer will take data from queue to write to clickhouse
    * @param records list of rows to be inserted
    * @param destSchema schema of destination table to parse data
    *  @return number of row inserted
    */
  override def write(records: Seq[Record], destSchema: TableSchema): Int =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::write") {
      val lines: Seq[String] = records.map(record => JsonUtils.toJson(record, false))
      localFileService.writeLines(lines, destSchema)
    }

  def getTableSchema(filePath: String): TableSchema = {
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
      localFileService.flushUnfinishedFiles()
      clickhouseConsumerThread.join()
      ensureNoError()
    }

  private def ensureNoError(): Unit = {
    if (exceptions.nonEmpty) {
      throw FinishingDataWriterException("got error when write data to clickhouse", exceptions)
    }
  }

  private def toSelectedStatement(tableSchema: TableSchema): String = {
    tableSchema.columns
      .map {
        case column: BoolColumn       => buildColumnName(column.name)
        case column: Int8Column       => buildColumnName(column.name)
        case column: Int16Column      => buildColumnName(column.name)
        case column: Int32Column      => buildColumnName(column.name)
        case column: Int64Column      => buildColumnName(column.name)
        case column: UInt8Column      => buildColumnName(column.name)
        case column: UInt16Column     => buildColumnName(column.name)
        case column: UInt32Column     => buildColumnName(column.name)
        case column: UInt64Column     => buildColumnName(column.name)
        case column: FloatColumn      => buildColumnName(column.name)
        case column: DoubleColumn     => buildColumnName(column.name)
        case column: StringColumn     => buildColumnName(column.name)
        case column: DateColumn       => buildColumnName(column.name) + "/1000"
        case column: DateTimeColumn   => buildColumnName(column.name) + "/1000"
        case column: DateTime64Column => buildColumnName(column.name)
        case column: NestedColumn     => buildColumnName(column.name)
      }
      .mkString(",")
  }

  private def toInputStatement(tableSchema: TableSchema): String = {
    tableSchema.columns
      .map {
        case column: BoolColumn   => buildColumnName(column.name) + toInputType("UInt8", column.isNullable)
        case column: Int8Column   => buildColumnName(column.name) + toInputType("Int8", column.isNullable)
        case column: Int16Column  => buildColumnName(column.name) + toInputType("Int16", column.isNullable)
        case column: Int32Column  => buildColumnName(column.name) + toInputType("Int32", column.isNullable)
        case column: Int64Column  => buildColumnName(column.name) + toInputType("Int64", column.isNullable)
        case column: UInt8Column  => buildColumnName(column.name) + toInputType("UInt8", column.isNullable)
        case column: UInt16Column => buildColumnName(column.name) + toInputType("UInt16", column.isNullable)
        case column: UInt32Column => buildColumnName(column.name) + toInputType("UInt32", column.isNullable)
        case column: UInt64Column => buildColumnName(column.name) + toInputType("UInt64", column.isNullable)
        case column: FloatColumn  => buildColumnName(column.name) + toInputType("Float32", column.isNullable)
        case column: DoubleColumn => buildColumnName(column.name) + toInputType("Float64", column.isNullable)
        case column: StringColumn => buildColumnName(column.name) + toInputType("String", column.isNullable)
        case column: DateColumn =>
          buildColumnName(column.name) + toInputType("Int64", column.isNullable) // Millisecond input
        case column: DateTimeColumn =>
          buildColumnName(column.name) + toInputType("Int64", column.isNullable) // Millisecond input
        case column: DateTime64Column => buildColumnName(column.name) + toInputType("DateTime64(3)", column.isNullable)
      }
      .mkString(",")
  }

  private def toInputType(dataType: String, isNullable: Boolean): String = {
    if (isNullable) {
      s" Nullable($dataType)"
    } else {
      s" $dataType"
    }
  }

  private def toColumnNames(schema: TableSchema): String = {
    schema.columns.map(c => s"`${c.name}`").mkString(",")
  }

  private def buildColumnName(columnName: String): String = {
    s"`_$columnName`"
  }
}
