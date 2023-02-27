package datainsider.jobworker.repository.writer

import com.ptl.util.JsonUtil
import com.twitter.inject.Logging
import com.typesafe.config.Config
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.client.exception.DbExecuteError
import datainsider.client.util.JdbcClient.Record
import datainsider.client.util.Using
import datainsider.common.profiler.Profiler
import datainsider.jobworker.domain.setting.ClickhouseConnectionSetting
import datainsider.jobworker.module.MainModule
import datainsider.jobworker.util.ZConfig

import java.io.File
import java.lang.Thread.UncaughtExceptionHandler
import java.util.concurrent.atomic.AtomicBoolean
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.io.Source
import scala.language.postfixOps
import scala.sys.process._

class FileClickhouseWriter(config: Config) extends DataWriter with Logging {
  val envClickhouseSetting: Option[ClickhouseConnectionSetting] = MainModule.provideClickhouseConnectionSetting()

  val clickhouseHost: String = if (envClickhouseSetting.isDefined) {
    envClickhouseSetting.get.host
  } else config.getString("clickhouse-config.host")

  val clickhousePort: Int = if (envClickhouseSetting.isDefined) {
    envClickhouseSetting.get.tcpPort
  } else config.getInt("clickhouse-config.port")

  val clickhouseUsername: String = if (envClickhouseSetting.isDefined) {
    envClickhouseSetting.get.username
  } else config.getString("clickhouse-config.username")

  val clickhousePassword: String = if (envClickhouseSetting.isDefined) {
    envClickhouseSetting.get.password
  } else config.getString("clickhouse-config.password")

  val encryptMode: String = config.getString("clickhouse-config.encryption.mode")
  val privateKey: String = config.getString("clickhouse-config.encryption.key")
  val initialVector: String = config.getString("clickhouse-config.encryption.iv")

  val sleepIntervalMs: Long = ZConfig.getLong("sleep_interval_ms", 10000)
  val isPullDataFinished: AtomicBoolean = new AtomicBoolean(false)
  val localFileService: LocalFileWriter = new LocalFileWriterImpl(config.getConfig("local-file-writer"))
  var uncaughtThrowable: Option[Throwable] = None

  val clickhouseConsumerThread = new Thread(() => {
    while (!isPullDataFinished.get() || localFileService.currentQueueSize() != 0) {
      localFileService.getFinishedFile match {
        case Some(filePath) =>
          try {
            processFile(filePath)
          } catch {
            case e: Throwable => error(s"${this.getClass.getSimpleName}::consume to clickhouse failed: $e")
          } finally {
            deleteFile(filePath)
          }
        case None =>
          Thread.sleep(sleepIntervalMs)
      }
    }
  })

  private def processFile(filePath: String): Unit =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::processFile") {
      info(s"${this.getClass.getSimpleName}::processFile import to clickhouse file: $filePath")
      val tblSchema: TableSchema = getTableSchema(filePath)
      val selectedStatement = toSelectedStatement(tblSchema)
      val colNames = toColumnNames(tblSchema)
      val inputStatement = toInputStatement(tblSchema)

      val cmd = ArrayBuffer(
        "clickhouse-client",
        s"--host=$clickhouseHost",
        s"--port=$clickhousePort",
        s"--user=$clickhouseUsername",
        s"--query=INSERT INTO ${tblSchema.dbName}.${tblSchema.name}($colNames) SELECT $selectedStatement FROM input('$inputStatement') FORMAT JSONCompactEachRow"
      )

      if (clickhousePassword.nonEmpty) cmd += s"--password=$clickhousePassword"

      var processLog = ""
      val processLogger = ProcessLogger(log => {
        processLog += s"\n$log"
      })
      val exitValue: Int = Process(s"tail -n +2 $filePath").#|(cmd).run(processLogger).exitValue()
      if (exitValue == 0) {
        info(s"process file $filePath finish with message: $processLog")
      } else {
        error(s"got error when insert data to clickhouse, log: $processLog")
        throw DbExecuteError(s"got error when insert data to clickhouse, log: $processLog")
      }
    }

  clickhouseConsumerThread.setUncaughtExceptionHandler(new UncaughtExceptionHandler {
    override def uncaughtException(t: Thread, throwable: Throwable): Unit = {
      uncaughtThrowable = Some(throwable)
      clickhouseConsumerThread.start()
    }
  })
  clickhouseConsumerThread.start()

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
      localFileService.writeLine(records, destSchema)
    }

  def getTableSchema(filePath: String): TableSchema = {
    val file = new File(filePath)
    val firstLine = Using(Source.fromFile(file))(_.getLines().next())
    JsonUtil.fromJson[TableSchema](firstLine)
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

  /***
    * Finish write data
    * Add current file to queue. Wait for write all data success or get error
    * @return
    */
  override def finishing(): Unit =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::finishing") {
      isPullDataFinished.set(true)
      localFileService.flushUnfinishedFiles()
      while (clickhouseConsumerThread.isAlive) {
        Thread.sleep(sleepIntervalMs)
      }
      uncaughtThrowable match {
        case Some(throwable) => throw DbExecuteError(throwable.getMessage)
        case None            =>
      }
    }

  private def toSelectedStatement(tableSchema: TableSchema): String = {
    tableSchema.columns
      .map {
        case column: BoolColumn   => buildColumnName(column.name)
        case column: Int8Column   => buildColumnName(column.name)
        case column: Int16Column  => buildColumnName(column.name)
        case column: Int32Column  => buildColumnName(column.name)
        case column: Int64Column  => buildColumnName(column.name)
        case column: UInt8Column  => buildColumnName(column.name)
        case column: UInt16Column => buildColumnName(column.name)
        case column: UInt32Column => buildColumnName(column.name)
        case column: UInt64Column => buildColumnName(column.name)
        case column: FloatColumn  => buildColumnName(column.name)
        case column: DoubleColumn => buildColumnName(column.name)
        case column: StringColumn =>
          if (column.isEncrypted) {
            s"encrypt('$encryptMode', ${buildColumnName(column.name)}, unhex('$privateKey'), unhex('$initialVector'))"
          } else {
            buildColumnName(column.name)
          }
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
