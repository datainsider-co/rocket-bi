package datainsider.jobworker.service.worker

import com.google.api.client.auth.oauth2.Credential
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.sheets.v4.Sheets
import com.google.api.services.sheets.v4.model.{Sheet, Spreadsheet, ValueRange}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.client.exception.{BadRequestError, DbExecuteError, InternalError}
import datainsider.client.service.SchemaClientService
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain._
import datainsider.jobworker.repository.writer.DataWriter
import datainsider.jobworker.service.OAuth2CredentialService
import datainsider.jobworker.util.Implicits.FutureEnhance
import datainsider.jobworker.util.ZConfig
import education.x.commons.SsdbKVS

import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat
import java.util
import java.util.concurrent.atomic.AtomicBoolean
import scala.collection.JavaConverters._
import scala.collection.convert.ImplicitConversions.`collection AsScalaIterable`
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.control.NonFatal

class GoogleSheetWorker(schemaService: SchemaClientService, ssdbKVS: SsdbKVS[Long, Boolean])
    extends JobWorker[GoogleSheetJob]
    with Logging {

  val isRunning: AtomicBoolean = new AtomicBoolean(true)

  override def run(job: GoogleSheetJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    try {
      sync(job, syncId, onProgress)
    } catch {
      case throwable: Throwable =>
        error(throwable.getLocalizedMessage, throwable)
        GoogleSheetProgress(
          orgId = job.orgId,
          syncId = syncId,
          jobId = job.jobId,
          updatedTime = System.currentTimeMillis(),
          jobStatus = JobStatus.Error,
          totalSyncRecord = 0,
          totalExecutionTime = 0,
          message = Some(throwable.getMessage)
        )
    } finally {
      ssdbKVS.remove(syncId)
    }
  }

  private def sync(job: GoogleSheetJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    val destTableSchema =
      job.schema.copy(dbName = job.destDatabaseName, name = job.destTableName, organizationId = job.orgId)
    ensureTableSchema(destTableSchema, job.destinations)
    val writers: Seq[DataWriter] = job.destinations.map(dest => DataWriter(dest))
    val batchSize = ZConfig.getInt("sync_batch_size", 1000)
    val service: Sheets = buildService(job.accessToken, job.refreshToken)

    val sheet: Sheet = getSheet(service, job.spreadSheetId, job.sheetId)
    val totalRow: Long = sheet.getProperties.getGridProperties.getRowCount.toLong
    val sheetTitle = sheet.getProperties.getTitle

    val beginTime: Long = System.currentTimeMillis()
    val jobProgress =
      GoogleSheetProgress(
        job.orgId,
        syncId,
        job.jobId,
        System.currentTimeMillis(),
        JobStatus.Syncing,
        totalRow,
        System.currentTimeMillis() - beginTime
      )
    onProgress(jobProgress)

    var rowInserted: Int = 0
    var curRow: Int = if (job.includeHeader) 2 else 1

    while (curRow <= totalRow && isRunning.get()) {
      ssdbKVS.get(syncId).map {
        case Some(value) => isRunning.set(value)
        case None        =>
      }

      try {
        val records: Seq[Record] =
          getData(service, job.spreadSheetId, sheetTitle, curRow, batchSize, job.schema.columns)

        writers.foreach(writer => {
          if (records.nonEmpty) try {
            writer.write(records, destTableSchema)
          } catch {
            case e: Throwable => error(s"${writer.getClass} write ${records.length} records failed, reason: $e")
          }
        })

        rowInserted = rowInserted + records.length
        curRow = curRow + batchSize
      } catch {
        case e: Throwable =>
          logger.error(s"${this.getClass.getSimpleName}::sync failed", e)

          val errorProgress: JobProgress =
            GoogleSheetProgress(
              job.orgId,
              syncId,
              job.jobId,
              System.currentTimeMillis(),
              JobStatus.Error,
              rowInserted,
              System.currentTimeMillis() - beginTime,
              Some(e.getMessage)
            )

          return errorProgress
      }
    }

    val finalStatus: JobStatus =
      if (isRunning.get()) {
        JobStatus.Synced
      } else {
        JobStatus.Terminated
      }

    writers.foreach(_.finishing())

    val finalProgress = jobProgress.copy(
      jobStatus = finalStatus,
      updatedTime = System.currentTimeMillis(),
      totalSyncRecord = rowInserted,
      totalExecutionTime = System.currentTimeMillis() - beginTime
    )

    finalProgress
  }

  private def buildService(accessToken: String, refreshToken: String): Sheets = {
    try {
      val HTTP_TRANSPORT: NetHttpTransport = GoogleNetHttpTransport.newTrustedTransport
      val JSON_FACTORY = GsonFactory.getDefaultInstance
      val serverEncodedUrl = ZConfig.getString("google.server_encoded_url")
      val credential: Credential = OAuth2CredentialService.buildCredentialFromToken(accessToken, refreshToken, serverEncodedUrl)
      new Sheets.Builder(HTTP_TRANSPORT, JSON_FACTORY, credential).setApplicationName("DataInsider").build()
    } catch {
      case e: Throwable => throw InternalError(s"${this.getClass.getSimpleName}::buildService failed", e)
    }
  }

  private def getSheet(service: Sheets, spreadSheetId: String, sheetId: Int): Sheet = {
    try {
      val metaData: Spreadsheet = service.spreadsheets().get(spreadSheetId).execute()
      val sheets = metaData.getSheets
      sheets.find(_.getProperties.getSheetId.equals(sheetId)).get
    } catch {
      case e: Throwable => throw InternalError(s"${this.getClass.getSimpleName}::getSheet failed", e)
    }
  }

  private def getData(
      service: Sheets,
      spreadSheetId: String,
      sheetTitle: String,
      curRow: Int,
      batchSize: Int,
      columns: Seq[Column]
  ): Seq[Record] = {
    try {
      val range: String = s"$sheetTitle!$curRow:${curRow + batchSize}"
      val response: ValueRange = service.spreadsheets().values().get(spreadSheetId, range).execute()
      val dataRows = response.getValues

      if (dataRows != null) {
        dataRows.map(row => toRecord(row.map(_.toString).toSeq, columns)).toSeq
      } else {
        Seq.empty
      }
    } catch {
      case e: Throwable =>
        logger.error(s"${this.getClass.getSimpleName}::getData failed, ex: ", e)
        Seq.empty
    }
  }

  private def toRecord(row: Seq[String], columns: Seq[Column]): Record = {
    val record: Seq[String] = row ++ Seq.fill(columns.length - row.length)(null)
    record.zip(columns).map {
      case (valueStr, column) =>
        try {
          column match {
            case _: Int32Column      => convertToInt(valueStr).getOrElse(null)
            case _: DoubleColumn     => convertToDouble(valueStr).getOrElse(null)
            case _: StringColumn     => valueStr
            case _: Int64Column      => convertToLong(valueStr).getOrElse(null)
            case _: BoolColumn       => if (valueStr.toLowerCase() == "true") true else false
            case c: DateTimeColumn   => parseTimeStr(valueStr, c.inputFormats).orNull
            case c: DateTime64Column => parseDateTime64Str(valueStr, c.inputFormats).getOrElse(null)
            case _: FloatColumn      => convertToFloat(valueStr).getOrElse(null)
            case _: DateColumn       => convertToDate(valueStr).getOrElse(null)
            case _                   => valueStr
          }
        } catch {
          case _: Throwable => throw BadRequestError(s"unable to parse row: ${row.mkString(", ")}")
        }
    }
  }

  private def convertToDate(value: String): Option[Date] = {
    try {
      val format = new SimpleDateFormat("yyyy-MM-dd")
      val date = new Date(format.parse(value).getTime)
      Some(date)
    } catch {
      case _: Throwable => None
    }
  }

  private def convertToFloat(value: String): Option[Float] = {
    try {
      Some(value.toFloat)
    } catch {
      case _: Throwable => None
    }
  }

  private def convertToInt(value: String): Option[Int] = {
    try {
      Some(value.toInt)
    } catch {
      case _: Throwable => None
    }
  }

  private def convertToLong(value: String): Option[Long] = {
    try {
      Some(value.toLong)
    } catch {
      case _: Throwable => None
    }
  }

  private def convertToDouble(value: String): Option[Double] = {
    try {
      Some(value.toDouble)
    } catch {
      case _: Throwable => None
    }
  }

  private def parseTimeStr(dateStr: String, formats: Seq[String]): Option[Timestamp] = {
    try {
      val formatter = new SimpleDateFormat(formats.head)
      val datetime = formatter.parse(dateStr)
      Some(new Timestamp(datetime.getTime))
    } catch {
      case _: Throwable => None
    }
  }

  private def parseDateTime64Str(dateStr: String, formats: Seq[String]): Option[Long] = {
    try {
      val formatter = new SimpleDateFormat(formats.head)
      val datetime = formatter.parse(dateStr)
      Some(datetime.getTime)
    } catch {
      case _: Throwable => None
    }
  }

  private def ensureTableSchema(tableSchema: TableSchema, destinations: Seq[DataDestination]): Unit = {
    destinations.foreach {
      case DataDestination.Clickhouse =>
        schemaService.createOrMergeTableSchema(tableSchema).sync()
      case DataDestination.Hadoop =>
    }
  }
}
