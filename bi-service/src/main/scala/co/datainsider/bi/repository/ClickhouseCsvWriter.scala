package co.datainsider.bi.repository

import co.datainsider.bi.module.BIServiceModule
import co.datainsider.bi.util.{StringUtils, ZConfig}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.{DbExecuteError, InternalError}
import datainsider.profiler.Profiler

import java.io.File
import java.nio.file.{Files, Paths}
import java.time.Duration
import java.util.{Timer, TimerTask}
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.sys.process.{Process, ProcessLogger}

object ClickhouseCsvWriter extends Logging {
  private val WORK_DIR: String = "/tmp/csv"
  private val CLEANUP_INTERVAL_IN_MIN: Int = 15
  private val TTL_IN_MIN: Int = 15

  private val clickhouseEnvSetting = BIServiceModule.provideClickhouseConnectionSetting()

  private val clickhouseHost =
    if (clickhouseEnvSetting.isDefined) {
      clickhouseEnvSetting.get.host
    } else {
      ZConfig.getString("clickhouse_csv_writer.host")
    }
  private val clickhousePort = if (clickhouseEnvSetting.isDefined) {
    clickhouseEnvSetting.get.tcpPort
  } else {
    ZConfig.getString("clickhouse_csv_writer.tcp_port")
  }
  private val clickhouseUsername =
    if (clickhouseEnvSetting.isDefined) {
      clickhouseEnvSetting.get.username
    } else {
      ZConfig.getString("clickhouse_csv_writer.username")
    }
  private val clickhousePassword =
    if (clickhouseEnvSetting.isDefined) {
      clickhouseEnvSetting.get.password
    } else {
      ZConfig.getString("clickhouse_csv_writer.password")
    }
  private def clickhouseUseSsl: Boolean =
    if (clickhouseEnvSetting.isDefined) {
      clickhouseEnvSetting.get.useSsl
    } else {
      ZConfig.getBoolean("clickhouse_csv_writer.use_ssl", default = false)
    }

  prepareWorkDir()
  scheduleAutoCleanup()

  // return created file path
  def exportToFile(fromSql: String): Future[String] =
    Profiler(s"[Writer] ${this.getClass.getSimpleName}::exportToFile") {
      val destPath: String = s"$WORK_DIR/${StringUtils.shortMd5(fromSql)}.csv"

      val file = new File(destPath)
      if (file.exists()) {
        return Future(destPath)
      }

      createFile(fromSql, destPath)
    }

  def createFile(fromSql: String, filePath: String): Future[String] =
    Profiler(s"[Writer] ${this.getClass.getSimpleName}::createFile") {
      Future {

        val exportQuery = s"$fromSql into outfile '$filePath' format CSV"

        val cmd = ArrayBuffer(
          "clickhouse-client",
          s"--host=$clickhouseHost",
          s"--port=$clickhousePort",
          s"--user=$clickhouseUsername",
          s"--query=$exportQuery"
        )

        if (clickhousePassword.nonEmpty) cmd += s"--password=$clickhousePassword"
        if (clickhouseUseSsl) cmd += s"--secure"

        var processLog = ""
        val processLogger = ProcessLogger(log => {
          processLog += s"\n$log"
        })

        val exitValue: Int = Process(cmd).run(processLogger).exitValue()
        if (exitValue == 0) {
          info(s"csv file written to $filePath")
          filePath
        } else {
          throw DbExecuteError(s"got error when export data to csv, log: $processLog")
        }

      }
    }

  private def scheduleAutoCleanup(): Unit = {
    val cleanUpTask = new TimerTask {
      override def run(): Unit = {
        try {
          deleteFiles(TTL_IN_MIN)
        } catch {
          case e: Throwable => error(s"cleanUpTask failed with exception: ${e}")
        }
      }
    }

    val timer: Timer = new Timer()
    val delayMs: Long = Duration.ofMinutes(CLEANUP_INTERVAL_IN_MIN).toMillis
    val periodMs: Long = Duration.ofMinutes(CLEANUP_INTERVAL_IN_MIN).toMillis

    info(s"Auto cleanup csv files task scheduled! Time between two run is: $periodMs ms")
    timer.scheduleAtFixedRate(cleanUpTask, delayMs, periodMs)
  }

  def deleteFiles(ttlInMin: Int): Unit =
    Profiler(s"[Writer] ${this.getClass.getSimpleName}::deleteFiles") {
      val cmd = ArrayBuffer(
        "find",
        s"$WORK_DIR/",
        "-mindepth",
        "1",
        "-cmin",
        s"+${ttlInMin}",
        "-delete"
      )

      var processLog = ""
      val processLogger = ProcessLogger(log => {
        processLog += s"\n$log"
      })

      val exitValue: Int = Process(cmd).run(processLogger).exitValue()
      if (exitValue == 0) {
        info(s"clean up tmp csv file success")
      } else {
        throw InternalError(s"got error when delete temp csv files, log: $processLog")
      }

    }

  private def prepareWorkDir(): Unit = {
    try {
      Files.createDirectories(Paths.get(WORK_DIR))
    } catch {
      case e: Throwable => error("failed to create work dir to export csv files")
    }
  }
}
