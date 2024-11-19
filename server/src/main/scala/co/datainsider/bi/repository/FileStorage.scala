package co.datainsider.bi.repository

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.{DataStream, Engine}
import co.datainsider.bi.repository.FileStorage.FileType.FileType
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.{StringUtils, Using}
import co.datainsider.schema.domain.column._
import com.fasterxml.jackson.core.`type`.TypeReference
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import co.datainsider.common.client.exception.InternalError
import org.apache.poi.ss.usermodel.{CellStyle, CreationHelper}
import org.apache.poi.xssf.streaming.{SXSSFCell, SXSSFRow, SXSSFSheet, SXSSFWorkbook}

import java.io.{BufferedWriter, File, FileOutputStream, FileWriter}
import java.nio.file.{Files, Paths}
import java.text.SimpleDateFormat
import java.time.Duration
import java.util.{Date, Timer, TimerTask}
import scala.collection.mutable.ArrayBuffer
import scala.sys.process.{Process, ProcessLogger}

object FileStorage extends Logging {
  private val WORK_DIR: String = "/tmp/rocket_bi"
  private val CLEANUP_INTERVAL_IN_MIN: Int = 15
  private val TTL_IN_MIN: Int = 15

  prepareWorkDir()
  scheduleAutoCleanup()

  def get(orgId: Long, engine: Engine, sql: String, fileType: FileType): Future[String] = {
    val fileExtension = getFileExtension(fileType)

    val destPath: String = s"$WORK_DIR/${StringUtils.shortMd5(orgId + sql)}.$fileExtension"
    val file = new File(destPath)

    if (file.exists()) {
      Future(destPath)
    } else {
      engine.exportToFile(sql, destPath, fileType)
    }
  }

  def getFileExtension(fileType: FileType): String = {
    fileType match {
      case FileType.Csv   => "csv"
      case FileType.Excel => "xlsx"
    }
  }

  def exportToFile(dataStream: DataStream, fileType: FileType, destPath: String): String = {
    fileType match {
      case FileType.Csv   => FileStorage.CsvUtils.write(dataStream, destPath)
      case FileType.Excel => FileStorage.ExcelUtils.write(dataStream, destPath)
    }

    destPath
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

  private def deleteFiles(ttlInMin: Int): Unit =
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

  object FileType extends Enumeration {
    type FileType = Value
    val Csv: FileType = Value("Csv")
    val Excel: FileType = Value("Excel")
  }

  class FileTypeRef extends TypeReference[FileType.type]


  object ExcelUtils {

    /**
      * https://poi.apache.org/components/spreadsheet/how-to.html#sxssf
      */
    def write(dataStream: DataStream, destPath: String): Unit = {
      val columns: Seq[Column] = dataStream.columns
      val workbook: SXSSFWorkbook = new SXSSFWorkbook()
      val sheet: SXSSFSheet = workbook.createSheet()
      val header: SXSSFRow = sheet.createRow(0)
      val creationHelper: CreationHelper = workbook.getCreationHelper
      val dateTimeStyle: CellStyle = workbook.createCellStyle
      dateTimeStyle.setDataFormat(creationHelper.createDataFormat().getFormat("m/d/yy h:mm"))
      val dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")

      for (i <- columns.indices) {
        val headerCell = header.createCell(i)
        headerCell.setCellValue(columns(i).name)
      }

      var rowCount = 1

      dataStream.stream.foreach(record => {
        try {
          val row: SXSSFRow = sheet.createRow(rowCount)
          rowCount += 1
          var colIndex = 0

          columns.zip(record).foreach {
            case (column, value) =>
              try {
                val cell: SXSSFCell = row.createCell(colIndex)
                colIndex += 1

                if (value != null) {
                  column match {
                    case _: BoolColumn   => cell.setCellValue(value.toString.toBoolean)
                    case _: Int32Column  => cell.setCellValue(value.toString.toInt)
                    case _: Int64Column  => cell.setCellValue(value.toString.toLong)
                    case _: DoubleColumn => cell.setCellValue(value.toString.toDouble)
                    case _: DateColumn | _: DateTimeColumn | _: DateTime64Column =>
                      val date: Date = dateFormat.parse(value.toString)
                      cell.setCellValue(date)
                      cell.setCellStyle(dateTimeStyle)
                    case _ => cell.setCellValue(value.toString)
                  }
                }
              } catch {
                case e: Throwable => throw e
              }
          }
        } catch {
          case e: Throwable => throw e
        }
      })

      val outputStream = new FileOutputStream(destPath)
      workbook.write(outputStream)
      workbook.dispose()
    }
  }

  object CsvUtils {
    def write(dataStream: DataStream, destPath: String): Unit = {
      Using(new FileWriter(destPath)) { fileWriter =>
        Using(new BufferedWriter(fileWriter)) { bufferedWriter =>
          val columns: Seq[Column] = dataStream.columns
          bufferedWriter.write(columns.map(_.name).mkString(",") + "\n")

          dataStream.stream.foreach(record => {
            val csvRow: String = record.mkString(",")
            bufferedWriter.write(csvRow + "\n")
          })

          bufferedWriter.flush()
        }
      }
    }
  }

}
