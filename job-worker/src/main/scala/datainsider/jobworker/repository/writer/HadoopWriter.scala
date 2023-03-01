package datainsider.jobworker.repository.writer

import com.ptl.util.JsonUtil
import com.twitter.inject.Logging
import com.typesafe.config.Config
import datainsider.client.domain.schema.TableSchema
import datainsider.client.util.Using
import datainsider.common.profiler.Profiler
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.util.{JsonUtils, ZConfig}

import java.io.{BufferedReader, File, FileReader}
import java.util.concurrent.atomic.AtomicBoolean
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.io.Source
import scala.util.control.NonFatal

class HadoopWriter(config: Config) extends DataWriter with Logging {
  val localFileService: LocalFileWriter = new LocalFileWriterImpl(config.getConfig("local-file-writer"))
  val sparkFileService: SparkFileService = new SparkFileServiceImpl(config.getConfig("hdfs"))
  val sleepIntervalMs: Long = ZConfig.getLong("sleep_interval_ms", 10000)
  val baseDir: String = config.getString("base_dir")
  val isPullDataFinished: AtomicBoolean = new AtomicBoolean(false)

  /**
    * write records to local file
    * local files that is full will push to queue
    * a consumer will take data from queue to write to hadoop
    * @param records list of rows to be inserted
    * @param destSchema schema of destination table to parse data
    *  @return number of row inserted
    */
  override def write(records: Seq[Record], destSchema: TableSchema): Int =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::write") {
      localFileService.writeLine(records, destSchema)
    }

  val hadoopConsumerThread = new Thread(
    () => {
      while (!isPullDataFinished.get() || localFileService.currentQueueSize() != 0) {
        localFileService.getFinishedFile match {
          case Some(filePath) =>
            try {
              processFile(filePath)
            } catch {
              case e: Throwable => error(s"consume to hadoop failed: $e")
            } finally {
              deleteFile(filePath)
            }
          case None =>
            Thread.sleep(sleepIntervalMs)
        }
      }
    },
    "HadoopConsumerThread"
  )

  private def processFile(filePath: String): Unit =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::processFile") {
      val tblSchema: TableSchema = getTableSchema(filePath)
      val rows: Seq[Seq[Any]] = getRows(filePath)
      val destPath = buildDestPath(tblSchema.dbName, tblSchema.name)
      sparkFileService.writeParquet(destPath, tblSchema, rows)
    }

  hadoopConsumerThread.start()

  def buildDestPath(dbName: String, tblName: String): String = {
    "/tmp" + baseDir + s"/$dbName/$tblName/${System.currentTimeMillis()}.parquet"
  }

  def getTableSchema(filePath: String): TableSchema =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::getTableSchema") {
      val file = new File(filePath)
      val firstLine = Using(Source.fromFile(file))(_.getLines().next())
      JsonUtil.fromJson[TableSchema](firstLine)
    }

  def getRows(filePath: String): Seq[Seq[Any]] =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::getRows") {
      val file = new File(filePath)
      val reader = new BufferedReader(new FileReader(file))
      try {
        val data = new ArrayBuffer[Seq[Any]]()
        reader.readLine() // ignore table schema line
        var line = reader.readLine()

        while (line != null) {
          try {
            data += JsonUtils.fromJson[Seq[Any]](line)
          } catch {
            case NonFatal(throwable) =>
              error(s"${getClass.getCanonicalName}.readDataFromFile", throwable)
          }
          line = reader.readLine()
        }
        info(s"read ${data.length} record from local file")
        data
      } finally {
        reader.close()
      }
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

  /**   *
    * Finish write data
    * Add current file to queue. Wait for write all data success or get error
    * @return
    */
  override def finishing(): Unit =
    Profiler(s"[DataWriter] ${this.getClass.getSimpleName}::finishing") {
      isPullDataFinished.set(true)
      localFileService.flushUnfinishedFiles()
      while (hadoopConsumerThread.isAlive) {
        Thread.sleep(sleepIntervalMs)
      }
    }
}
