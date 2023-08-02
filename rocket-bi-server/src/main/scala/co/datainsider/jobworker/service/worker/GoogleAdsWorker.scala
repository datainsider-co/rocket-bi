package co.datainsider.jobworker.service.worker

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.{Using, ZConfig}
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.domain.job.GoogleAdsJob
import co.datainsider.jobworker.domain.source.GoogleAdsSource
import co.datainsider.jobworker.repository.writer.DataWriter
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.jobworker.util.StringUtils.getOriginTblName
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import com.fasterxml.jackson.databind.JsonNode
import com.google.ads.googleads.lib.GoogleAdsClient
import com.google.ads.googleads.v12.services._
import com.google.auth.Credentials
import com.google.auth.oauth2.UserCredentials
import com.google.cloud.http.HttpTransportOptions.DefaultHttpTransportFactory
import com.google.protobuf.util.JsonFormat
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.util.JsonParser
import education.x.commons.KVS

import java.net.URI
import java.sql.{Date, Timestamp}
import java.text.SimpleDateFormat
import java.util
import java.util.Calendar
import java.util.concurrent.atomic.AtomicBoolean
import scala.collection.mutable.ArrayBuffer
import scala.concurrent.ExecutionContext.Implicits.global
import scala.util.Try

class GoogleAdsWorker(
    googleAdsSource: GoogleAdsSource,
    schemaService: SchemaClientService,
    jobInQueue: KVS[Long, Boolean],
    batchSize: Int,
    engine: Engine[Connection],
    connection: Connection
) extends JobWorker[GoogleAdsJob]
    with Logging {

  private val MICRO: Double = 1f / 1000000
  val startTime: Long = System.currentTimeMillis()
  var readRows: Long = 0
  val isRunning: AtomicBoolean = new AtomicBoolean(true)
  private val SERVER_ENCODED_URL: String = ZConfig.getString("google_ads_api.server_encoded_url")
  private val DEVELOPER_TOKEN: String = ZConfig.getString("google_ads_api.developer_token")
  private val CLIENT_ID: String = ZConfig.getString("google_ads_api.gg_client_id")
  private val CLIENT_SECRET: String = ZConfig.getString("google_ads_api.gg_client_secret")
  private val DEFAULT_START_TIME: String = ZConfig.getString("google_ads_api.default_start_time", "2019-01-01")
  private val INCREMENTAL_COLUMN = "segments.date"
  private val costFields = Set(
    "metrics.average_cost",
    "metrics.average_cpc",
    "metrics.average_cpe",
    "metrics.average_cpm",
    "metrics.average_cpv",
    "metrics.cost_micros",
    "metrics.cost_per_all_conversions",
    "metrics.cost_per_conversion",
    "metrics.cost_per_current_model_attributed_conversion"
  )

  override def run(job: GoogleAdsJob, syncId: SyncId, report: JobProgress => Future[Unit]): JobProgress = {
    val reportProgress: GoogleAdsProgress = GoogleAdsProgress(
      orgId = job.orgId,
      syncId = syncId,
      jobId = job.jobId,
      updatedTime = System.currentTimeMillis(),
      jobStatus = JobStatus.Syncing,
      totalSyncRecord = 0,
      totalExecutionTime = System.currentTimeMillis() - startTime,
      lastSyncedValue = job.lastSyncedValue,
      message = None
    )
    try {
      report(reportProgress)
      syncResource(job, syncId, report, reportProgress)
    } catch {
      case ex: Throwable =>
        logger.error(s"execute job fail: $job", ex)
        reportProgress.copy(
          jobStatus = JobStatus.Error,
          updatedTime = System.currentTimeMillis(),
          totalSyncRecord = 0,
          totalExecutionTime = System.currentTimeMillis() - startTime,
          lastSyncedValue = job.lastSyncedValue,
          message = Some(ex.getMessage)
        )
    } finally {
      jobInQueue.remove(syncId)
      logger.info(s"${Thread.currentThread().getName}: finish job: $job")
    }
  }

  private def syncResource(
      job: GoogleAdsJob,
      syncId: SyncId,
      report: JobProgress => Future[Unit],
      reportProgress: GoogleAdsProgress
  ): JobProgress = {
    val client: GoogleAdsClient = buildClient(googleAdsSource)
    val googleResource: GoogleResource = getGoogleResource(job.resourceName.toString)
    val tableSchema: TableSchema = getTableSchema(googleResource.columns, job)
    schemaService.createOrMergeTableSchema(tableSchema).sync()

    val writers: Seq[DataWriter] = Seq(engine.createWriter(connection))
    val query: String = buildQuery(googleResource.fieldNames, googleResource.resourceName, job)
    val response: util.Iterator[SearchGoogleAdsStreamResponse] = callApi(client, job.customerId, query)
    var lastSyncedValue: String = job.lastSyncedValue
    val incrementalColumnIndex = googleResource.fieldNames.indexWhere(_.equals(INCREMENTAL_COLUMN))
    while (response.hasNext && isRunning.get()) {
      val records = ArrayBuffer.empty[Record]
      val rows = response.next().getResultsList.iterator()
      while (rows.hasNext) {
        records += toRecord(rows.next(), tableSchema.columns)
      }
      readRows = readRows + records.length
      lastSyncedValue = job.syncMode match {
        case SyncMode.FullSync => ""
        case SyncMode.IncrementalSync =>
          if (incrementalColumnIndex == -1) throw new InternalError("can not find incremental column")
          else records.last(incrementalColumnIndex).toString
      }
      writers.foreach(writer => writer.write(records, tableSchema))
      reportToScheduler(syncId, report, reportProgress, lastSyncedValue)
    }

    writers.foreach(_.close())

    val finalStatus: JobStatus =
      if (isRunning.get()) {
        JobStatus.Synced
      } else {
        JobStatus.Terminated
      }

    reportProgress.copy(
      jobStatus = finalStatus,
      updatedTime = System.currentTimeMillis(),
      totalSyncRecord = readRows,
      totalExecutionTime = System.currentTimeMillis() - startTime,
      lastSyncedValue = lastSyncedValue
    )
  }

  private def callApi(
      client: GoogleAdsClient,
      customerId: String,
      query: String
  ): util.Iterator[SearchGoogleAdsStreamResponse] = {
    val request: SearchGoogleAdsStreamRequest = SearchGoogleAdsStreamRequest
      .newBuilder()
      .setCustomerId(customerId)
      .setQuery(query)
      .build()
    val googleAdsService: GoogleAdsServiceClient = client.getLatestVersion.createGoogleAdsServiceClient()
    googleAdsService.searchStreamCallable().call(request).iterator()
  }

  private def reportToScheduler(
      syncId: SyncId,
      report: JobProgress => Future[Unit],
      reportProgress: GoogleAdsProgress,
      lastSyncedValue: String
  ): Unit = {
    report(
      reportProgress.copy(
        updatedTime = System.currentTimeMillis(),
        totalSyncRecord = readRows,
        totalExecutionTime = System.currentTimeMillis() - startTime,
        lastSyncedValue = lastSyncedValue
      )
    )

    jobInQueue.get(syncId).map {
      case Some(value) => isRunning.set(value)
      case None        =>
    }
  }

  private def getToday: String = {
    val format = new SimpleDateFormat("yyyy-MM-dd")
    format.format(Calendar.getInstance().getTime)
  }

  private def buildQuery(selectedFields: Seq[String], resourceName: String, job: GoogleAdsJob): String = {
    val selectedStatement: String = selectedFields.mkString(",")
    if (selectedFields.contains("segments.date")) {
      buildQueryWithDateSegment(selectedStatement, resourceName, job)
    } else {
      buildNormalQuery(selectedStatement, resourceName, job)
    }
  }

  private def getIncrementalValue(job: GoogleAdsJob): Option[String] = {
    if (job.lastSyncedValue == null || job.lastSyncedValue.isEmpty)
      None
    else Some(job.lastSyncedValue)
  }

  private def buildNormalQuery(selectedStatement: String, resourceName: String, job: GoogleAdsJob): String = {

    job.syncMode match {
      case SyncMode.FullSync =>
        s"""
           |SELECT $selectedStatement FROM ${resourceName}
           |""".stripMargin
      case SyncMode.IncrementalSync =>
        throw new UnsupportedOperationException("Do not support build normal query for incremental sync")
    }
  }

  private def buildQueryWithDateSegment(selectedStatement: String, resourceName: String, job: GoogleAdsJob): String = {
    val startTime = job.startDate.getOrElse(DEFAULT_START_TIME)
    val incrementalValue = getIncrementalValue(job).getOrElse(getYesterday(startTime))
    job.syncMode match {
      case SyncMode.FullSync =>
        s"""
           |SELECT $selectedStatement FROM ${resourceName}
           |WHERE segments.date BETWEEN '${startTime}' AND '${getYesterday(getToday)}'
           |""".stripMargin
      case SyncMode.IncrementalSync =>
        s"""
           |SELECT $selectedStatement FROM ${resourceName}
           |WHERE segments.date BETWEEN '$startTime' AND '${getYesterday(getToday)}' AND $INCREMENTAL_COLUMN > '${incrementalValue}'
           |ORDER BY $INCREMENTAL_COLUMN ASC
           |""".stripMargin
    }
  }

  private def getYesterday(dateAsString: String): String = {
    val format = new SimpleDateFormat("yyyy-MM-dd")
    val date: util.Date = format.parse(dateAsString)
    val calendar = Calendar.getInstance()
    calendar.setTime(date)
    calendar.add(Calendar.DATE, -1)
    format.format(calendar.getTime)
  }

  def getTableSchema(job: GoogleAdsJob): TableSchema = {
    val columns = getGoogleResource(job.resourceName.toString).columns
    TableSchema(
      name = job.destTableName,
      dbName = job.destDatabaseName,
      organizationId = job.orgId,
      displayName = getOriginTblName(job.destTableName),
      columns = columns
    )
  }

  def getTableSchema(columns: Seq[Column], job: GoogleAdsJob) = {
    TableSchema(
      name = job.destTableName,
      dbName = job.destDatabaseName,
      organizationId = job.orgId,
      displayName = getOriginTblName(job.destTableName),
      columns = columns
    )
  }

  private def getGoogleResource(resourceName: String): GoogleResource = {
    Using(getClass.getClassLoader.getResourceAsStream(s"google_ads_schema/${resourceName}.json"))(is => {
      val columnsAsJson = scala.io.Source.fromInputStream(is).mkString
      val googleResource = JsonParser.fromJson[GoogleResource](columnsAsJson)
      googleResource
    })
  }

  def buildClient(source: GoogleAdsSource): GoogleAdsClient = {
    val credential: Credentials = buildCredentials(source)
    GoogleAdsClient
      .newBuilder()
      .setCredentials(credential)
      .setDeveloperToken(DEVELOPER_TOKEN)
      .build()
  }

  private def buildCredentials(source: GoogleAdsSource): Credentials = {
    UserCredentials
      .newBuilder()
      .setRefreshToken(source.refreshToken)
      .setClientId(CLIENT_ID)
      .setClientSecret(CLIENT_SECRET)
      .setHttpTransportFactory(new DefaultHttpTransportFactory())
      .setTokenServerUri(URI.create(SERVER_ENCODED_URL))
      .build()
  }

  private def toRecord(row: GoogleAdsRow, columns: Seq[Column]): Record = {
    val jsonString: String = JsonFormat.printer().print(row)
    val jsonNode: JsonNode = JsonParser.fromJson[JsonNode](jsonString)
    columns
      .map(column => {
        val fieldsName: String = toJsonPointer(toCamel(column.displayName))
        if (costFields.contains(fieldsName)) {
          convertCostValue(jsonNode.at(fieldsName), column)
        } else
          column match {
            case _: StringColumn   => Try(jsonNode.at(fieldsName).asText()).getOrElse(null)
            case _: BoolColumn     => Try(jsonNode.at(fieldsName).asBoolean()).getOrElse(null)
            case _: DateColumn     => convertToDate(jsonNode.at(fieldsName).asText()).orNull
            case _: DateTimeColumn => convertToTimestamp(jsonNode.at(fieldsName).asText()).orNull
            case _: DoubleColumn   => Try(jsonNode.at(fieldsName).asDouble()).getOrElse(null)
            case _: FloatColumn    => Try(jsonNode.at(fieldsName).asDouble()).getOrElse(null)
            case _: Int32Column    => Try(jsonNode.at(fieldsName).asInt()).getOrElse(null)
            case _: Int64Column    => Try(jsonNode.at(fieldsName).asLong()).getOrElse(null)
            case _: UInt64Column   => Try(jsonNode.at(fieldsName).asLong()).getOrElse(null)
          }
      })
      .toArray
  }

  /**
    * https://groups.google.com/g/adwords-scripts/c/mSl5bxSkwec
    * @param valueAsJson cost(micros) value
    * @param column use to detect data type
    */
  private def convertCostValue(valueAsJson: JsonNode, column: Column): Any = {
    Try(column match {
      case _: DoubleColumn => valueAsJson.asDouble() * MICRO
      case _: FloatColumn  => valueAsJson.asDouble() * MICRO
      case _: Int32Column  => valueAsJson.asInt() * MICRO
      case _: Int64Column  => valueAsJson.asLong() * MICRO
      case _: UInt64Column => valueAsJson.asLong() * MICRO
    }).getOrElse(null)
  }

  private def toCamel(str: String): String = {
    val split = str.split("_")
    val tail = split.tail.map { x => x.head.toUpper + x.tail }
    split.head + tail.mkString
  }

  private def toJsonPointer(str: String): String = {
    "/" + str.replaceAll("\\.", "/")
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

  private def convertToTimestamp(value: String): Option[Timestamp] = {
    try {
      val formatter = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss")
      val datetime = formatter.parse(value)
      Some(new Timestamp(datetime.getTime))
    } catch {
      case _: Throwable =>
        try {
          val format = new SimpleDateFormat("yyyy-MM-dd")
          Some(new Timestamp(format.parse(value).getTime))
        } catch {
          case _: Throwable => None
        }
    }
  }

}

/**
  * @param resourceName SỬ DỤNG ĐỂ GỌI API (build query)
  * @param columns các cột cho các field(tên khác tên fields) với "segments.name" fields thì sẽ được chứa bởi cột "segments_date"
  * @param fieldNames danh sách các fields mà resource có thể lấy được (build query).
  */
case class GoogleResource(resourceName: String, columns: Seq[Column], fieldNames: Seq[String])
