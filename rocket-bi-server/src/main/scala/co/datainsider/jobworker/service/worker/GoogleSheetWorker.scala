package co.datainsider.jobworker.service.worker

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.job.GoogleSheetJob
import co.datainsider.jobworker.domain.{GoogleSheetProgress, JobProgress, JobStatus}
import co.datainsider.jobworker.repository.writer.DataWriter
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.jobworker.util.{GoogleCredentialUtils, GoogleOAuthConfig}
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.column._
import com.google.api.client.auth.oauth2.Credential
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.json.gson.GsonFactory
import com.google.api.services.sheets.v4.Sheets
import com.google.api.services.sheets.v4.model.{Sheet, Spreadsheet, ValueRange}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.{BadRequestError, InternalError}
import education.x.commons.KVS

import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat
import java.util.concurrent.atomic.AtomicBoolean
import scala.collection.convert.ImplicitConversions.`collection AsScalaIterable`
import scala.concurrent.ExecutionContext.Implicits.global

class GoogleSheetWorker(
    schemaService: SchemaClientService,
    jobInQueue: KVS[Long, Boolean],
    googleOAuthConfig: GoogleOAuthConfig,
    engine: Engine[Connection],
    connection: Connection
) extends JobWorker[GoogleSheetJob]
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
      jobInQueue.remove(syncId)
    }
  }

  private def sync(job: GoogleSheetJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    val beginTime: Long = System.currentTimeMillis()
    val jobProgress =
      GoogleSheetProgress(
        job.orgId,
        syncId,
        job.jobId,
        System.currentTimeMillis(),
        JobStatus.Syncing,
        0,
        System.currentTimeMillis() - beginTime
      )
    onProgress(jobProgress)

    val destTableSchema =
      job.schema.copy(dbName = job.destDatabaseName, name = job.destTableName, organizationId = job.orgId)
    schemaService.createOrMergeTableSchema(destTableSchema).sync()

    val writers: Seq[DataWriter] = Seq(engine.createWriter(connection))
    val batchSize = ZConfig.getInt("sync_batch_size", 1000)
    val service: Sheets = buildService(job.accessToken, job.refreshToken)

    val sheet: Sheet = getSheet(service, job.spreadSheetId, job.sheetId)
    val totalRow: Long = sheet.getProperties.getGridProperties.getRowCount.toLong
    val sheetTitle = sheet.getProperties.getTitle

    var rowInserted: Int = 0
    var curRow: Int = if (job.includeHeader) 2 else 1

    while (curRow < totalRow && isRunning.get()) {
      jobInQueue.get(syncId).map {
        case Some(value) => isRunning.set(value)
        case None        =>
      }

      try {
        val records: Seq[Record] =
          getData(service, job.spreadSheetId, sheetTitle, curRow, batchSize, job.schema.columns)

        writers.foreach(writer => {
          if (records.nonEmpty) try {
            writer.insertBatch(records, destTableSchema)
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

    writers.foreach(_.close())

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
      val credential: Credential =
        GoogleCredentialUtils.buildCredentialFromToken(accessToken, refreshToken, googleOAuthConfig)
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
      val response: ValueRange =
        service
          .spreadsheets()
          .values()
          .get(spreadSheetId, range)
          .setValueRenderOption("UNFORMATTED_VALUE")
          .setDateTimeRenderOption("FORMATTED_STRING")
          .execute()
      val dataRows = response.getValues

      if (dataRows != null) {
        dataRows
          .map(row => {
            try {
              val record = toRecord(row.map(_.toString).toSeq, columns)
              record
            } catch {
              case e: Throwable => Array.empty[Any]
            }
          })
          .filterNot(_.isEmpty)
          .filterNot(r => r.forall(_ == null))
          .toSeq
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
    record
      .zip(columns)
      .map {
        case (valueStr, column) =>
          try {
            column match {
              case _: Int32Column      => convertToInt(valueStr).getOrElse(null)
              case _: DoubleColumn     => convertToDouble(valueStr).getOrElse(null)
              case _: StringColumn     => valueStr
              case _: Int64Column      => convertToLong(valueStr).getOrElse(null)
              case _: BoolColumn       => convertToBoolean(valueStr).getOrElse(null)
              case c: DateTimeColumn   => parseTimeStr(valueStr, c.inputFormats).orNull
              case c: DateTime64Column => parseDateTime64Str(valueStr, c.inputFormats).getOrElse(null)
              case _: FloatColumn      => convertToFloat(valueStr).getOrElse(null)
              case _: DateColumn       => convertToDate(valueStr).getOrElse(null)
              case _                   => valueStr
            }
          } catch {
            case e: Throwable => throw BadRequestError(s"unable to parse row: ${row.mkString(", ")}", e)
          }
      }
      .toArray
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

  private def convertToBoolean(value: String): Option[Boolean] = {
    try {
      Some(value.toBoolean)
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

}
