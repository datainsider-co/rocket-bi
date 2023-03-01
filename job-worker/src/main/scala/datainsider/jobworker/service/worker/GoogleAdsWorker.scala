package datainsider.jobworker.service.worker

import com.fasterxml.jackson.databind.JsonNode
import com.google.ads.googleads.lib.GoogleAdsClient
import com.google.ads.googleads.v12.enums.GoogleAdsFieldDataTypeEnum.GoogleAdsFieldDataType
import com.google.ads.googleads.v12.resources.GoogleAdsField
import com.google.ads.googleads.v12.services.{
  GoogleAdsFieldServiceClient,
  GoogleAdsRow,
  GoogleAdsServiceClient,
  SearchGoogleAdsRequest,
  SearchGoogleAdsStreamRequest,
  SearchGoogleAdsStreamResponse
}
import com.google.auth.Credentials
import com.google.auth.oauth2.UserCredentials
import com.google.cloud.http.HttpTransportOptions.DefaultHttpTransportFactory
import com.google.protobuf.util.JsonFormat
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.client.service.SchemaClientService
import datainsider.client.util.JsonParser
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.DataDestination.DataDestination
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain.SyncMode.SyncMode
import datainsider.jobworker.domain._
import datainsider.jobworker.exception.NotFoundException
import datainsider.jobworker.repository.writer.DataWriter
import datainsider.jobworker.util.Implicits.FutureEnhance
import datainsider.jobworker.util.StringUtils.getOriginTblName
import datainsider.jobworker.util.{JsonUtils, ZConfig}
import education.x.commons.SsdbKVS
import kong.unirest.Unirest

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
    ssdbKVS: SsdbKVS[Long, Boolean],
    batchSize: Int
) extends JobWorker[GoogleAdsJob]
    with Logging {

  val startTime: Long = System.currentTimeMillis()
  var readRows: Long = 0
  val isRunning: AtomicBoolean = new AtomicBoolean(true)
  private val SERVER_ENCODED_URL: String = ZConfig.getString("google_ads_api.server_encoded_url")
  private val DEVELOPER_TOKEN: String = ZConfig.getString("google_ads_api.developer_token")
  private val CLIENT_ID: String = ZConfig.getString("google_ads_api.gg_client_id")
  private val CLIENT_SECRET: String = ZConfig.getString("google_ads_api.gg_client_secret")
  private val METADATA_URI: String = ZConfig.getString("google_ads_api.metadata_uri")
  private val DEFAULT_START_TIME: String = ZConfig.getString("google_ads_api.default_start_time", "2019-01-01")
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
      ssdbKVS.remove(syncId)
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
    val tableSchema: TableSchema = getTableSchema(client, job)
    ensureTableSchema(tableSchema, job.destinations)
    val writers: Seq[DataWriter] = job.destinations.map(dest => DataWriter(dest))
    val incrementalColumnIndex: Int = job.incrementalColumn match {
      case Some(value) =>
        tableSchema.columns.indexWhere(_.name == value)
      case None => 0
    }
    if (incrementalColumnIndex == -1)
      throw new NotFoundException(s"incremental column(${job.incrementalColumn.get}) not exist")
    var lastSyncedValue: String = job.lastSyncedValue

    val query: String = job.query.getOrElse(buildQuery(tableSchema, job))
    val response: util.Iterator[SearchGoogleAdsStreamResponse] = callApi(client, job.customerId, query)
    while (response.hasNext && isRunning.get()) {
      val records = ArrayBuffer.empty[Record]
      val rows = response.next().getResultsList.iterator()
      while (rows.hasNext) {
        records += toRecord(rows.next(), tableSchema.columns)
      }
      readRows = readRows + records.length
      lastSyncedValue = records.last(incrementalColumnIndex).toString
      writers.foreach(writer => writer.write(records, tableSchema))
      reportToScheduler(syncId, report, reportProgress, lastSyncedValue)
    }

    writers.foreach(_.finishing())

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

  private def detectFields(query: String): Seq[String] = {
    val normalizeQuery: String = query.toLowerCase()
    val startIndex = 6
    val endIndex = normalizeQuery.indexOf(" from ")
    val selectStatement: String = normalizeQuery.substring(startIndex, endIndex)
    selectStatement.split(",").map(_.replaceAll(" ", ""))
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

    ssdbKVS.get(syncId).map {
      case Some(value) => isRunning.set(value)
      case None        =>
    }
  }

  private def getStartTime(startTime: Option[String]) = {
    if (startTime.nonEmpty) {
      startTime.get
    } else DEFAULT_START_TIME
  }

  private def buildQuery(tableSchema: TableSchema, job: GoogleAdsJob): String = {
    val selectedFields: Seq[String] = tableSchema.columns.map(_.name)
    val selectedStatement: String = selectedFields.mkString(",")
    selectedFields.find(_.equals("segments.date")) match {
      case None =>
        job.syncMode match {
          case SyncMode.FullSync =>
            s"""
               |SELECT $selectedStatement FROM ${job.resourceName}
               |""".stripMargin
          case SyncMode.IncrementalSync =>
            s"""
               |SELECT $selectedStatement FROM ${job.resourceName}
               |WHERE ${job.incrementalColumn.get} > ${job.lastSyncedValue}
               |ORDER BY ${job.incrementalColumn.get} ASC
               |""".stripMargin
        }
      case Some(value) => buildSegmentQuery(selectedStatement, job, value)
    }
  }

  private def buildSegmentQuery(selectedStatement: String, job: GoogleAdsJob, segmentsField: String): String = {
    job.syncMode match {
      case SyncMode.FullSync =>
        s"""
           |SELECT $selectedStatement FROM ${job.resourceName}
           |WHERE $segmentsField BETWEEN '${getStartTime(job.startDate)}' AND '$getToday'
           |""".stripMargin
      case SyncMode.IncrementalSync =>
        s"""
           |SELECT $selectedStatement FROM ${job.resourceName}
           |WHERE $segmentsField BETWEEN '${getStartTime(job.startDate)}' AND '$getToday' AND ${job.incrementalColumn.get} > ${job.lastSyncedValue}
           |ORDER BY ${job.incrementalColumn.get} ASC
           |""".stripMargin
    }
  }

  private def getToday: String = {
    val format = new SimpleDateFormat("yyyy-MM-dd")
    format.format(Calendar.getInstance().getTime)
  }

  def getTableSchema(client: GoogleAdsClient, job: GoogleAdsJob): TableSchema = {
    val columns = job.query match {
      case Some(query) =>
        val fieldNames: Seq[String] = detectFields(query)
        detectColumns(client, fieldNames)
      case None => detectColumns(job.resourceName)
    }
    TableSchema(
      name = job.destTableName,
      dbName = job.destDatabaseName,
      organizationId = job.orgId,
      displayName = getOriginTblName(job.destTableName),
      columns = columns
    )
  }

  private def detectColumns(resourceName: String): Seq[Column] = {
    try {
      val uri: String = METADATA_URI + s"/$resourceName.json"
      val response: String = Unirest.get(uri).asString().getBody
      val metadata: JsonNode = JsonParser.fromJson[JsonNode](response)
      val fieldNames: Seq[String] = getFieldNames(metadata)
      fieldNames.map(fieldName => {
        val fieldType: String = metadata.get("fields").get(fieldName).get("field_details").get("data_type").asText()
        val description =
          Try(metadata.get("fields").get(fieldName).get("field_details").get("description").asText()).toOption
        toColumn(fieldName, fieldType, description)
      })
    } catch {
      case e: Throwable =>
        logger.error(s"GoogleAdsWorker::detectColumns::${e.getMessage}", e)
        throw new InternalError("can not detect columns")
    }
  }

  private def detectColumns(client: GoogleAdsClient, columnNames: Seq[String]): Seq[Column] = {
    val service: GoogleAdsFieldServiceClient = client.getLatestVersion.createGoogleAdsFieldServiceClient()
    columnNames.map(columnName => {
      val metadata: GoogleAdsField = service.getGoogleAdsField(columnName)
      toColumn(columnName, metadata.getDataType)
    })
  }

  private def getFieldNames(metadata: JsonNode): Seq[String] = {
    val fieldNames = ArrayBuffer.empty[String]
    metadata
      .withArray[JsonNode]("attributes")
      .iterator()
      .forEachRemaining(fieldName => fieldNames += fieldName.asText())
    metadata
      .withArray[JsonNode]("metrics")
      .iterator()
      .forEachRemaining(fieldName => fieldNames += fieldName.asText())
    metadata
      .withArray[JsonNode]("segments")
      .iterator()
      .forEachRemaining(fieldName => {
        if (fieldName.asText().equals("segments.date")) {
          fieldNames += fieldName.asText()
        }
      })
    val selectableFieldNames: Seq[String] = toSelectableFields(fieldNames, metadata)
    selectableFieldNames
  }

  def toSelectableFields(fieldNames: Seq[String], metadata: JsonNode): Seq[String] = {
    fieldNames.filter(fieldName => {
      val incompatibleFields =
        metadata.get("fields").get(fieldName).get("incompatible_fields").toString
      val isCompatibleWithDataSegment =
        !JsonUtils.fromJson[Seq[String]](incompatibleFields).contains("segments.date")
      val isSelectable: Boolean =
        metadata.get("fields").get(fieldName).get("field_details").get("selectable").asBoolean()
      val isCompatible = isCompatibleWithDataSegment || !fieldNames.contains("segments.date")
      isSelectable && isCompatible
    })
  }

  private def toColumn(fieldName: String, fieldType: String, description: Option[String]): Column = {
    fieldType match {
      case "BOOLEAN" =>
        BoolColumn(name = fieldName, displayName = fieldName, isNullable = true, description = description)
      case "DATE" =>
        DateTimeColumn(name = fieldName, displayName = fieldName, isNullable = true, description = description)
      case "DOUBLE" =>
        DoubleColumn(name = fieldName, displayName = fieldName, isNullable = true, description = description)
      case "FLOAT" =>
        FloatColumn(name = fieldName, displayName = fieldName, isNullable = true, description = description)
      case "INT32" =>
        Int32Column(name = fieldName, displayName = fieldName, isNullable = true, description = description)
      case "INT64" =>
        Int64Column(name = fieldName, displayName = fieldName, isNullable = true, description = description)
      case "UINT64" =>
        UInt64Column(name = fieldName, displayName = fieldName, isNullable = true, description = description)
      case "STRING" =>
        StringColumn(name = fieldName, displayName = fieldName, isNullable = true, description = description)
      case _ => StringColumn(name = fieldName, displayName = fieldName, isNullable = true, description = description)
    }
  }

  private def toColumn(fieldName: String, fieldType: GoogleAdsFieldDataType): Column = {
    fieldType match {
      case GoogleAdsFieldDataType.BOOLEAN =>
        BoolColumn(name = fieldName, displayName = fieldName, isNullable = true)
      case GoogleAdsFieldDataType.DATE =>
        DateTimeColumn(name = fieldName, displayName = fieldName, isNullable = true)
      case GoogleAdsFieldDataType.DOUBLE =>
        DoubleColumn(name = fieldName, displayName = fieldName, isNullable = true)
      case GoogleAdsFieldDataType.FLOAT =>
        FloatColumn(name = fieldName, displayName = fieldName, isNullable = true)
      case GoogleAdsFieldDataType.INT32 =>
        Int32Column(name = fieldName, displayName = fieldName, isNullable = true)
      case GoogleAdsFieldDataType.INT64 =>
        Int64Column(name = fieldName, displayName = fieldName, isNullable = true)
      case GoogleAdsFieldDataType.UINT64 =>
        UInt64Column(name = fieldName, displayName = fieldName, isNullable = true)
      case GoogleAdsFieldDataType.STRING =>
        StringColumn(name = fieldName, displayName = fieldName, isNullable = true)
      case _ => StringColumn(name = fieldName, displayName = fieldName, isNullable = true)
    }
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
    columns.map(column => {
      val jsonPointer: String = toJsonPointer(toCamel(column.name))
      column match {
        case _: StringColumn   => Try(jsonNode.at(jsonPointer).asText()).getOrElse(null)
        case _: BoolColumn     => Try(jsonNode.at(jsonPointer).asBoolean()).getOrElse(null)
        case _: DateColumn     => convertToDate(jsonNode.at(jsonPointer).asText()).orNull
        case _: DateTimeColumn => convertToTimestamp(jsonNode.at(jsonPointer).asText()).orNull
        case _: DoubleColumn   => Try(jsonNode.at(jsonPointer).asDouble()).getOrElse(null)
        case _: FloatColumn    => Try(jsonNode.at(jsonPointer).asDouble()).getOrElse(null)
        case _: Int32Column    => Try(jsonNode.at(jsonPointer).asInt()).getOrElse(null)
        case _: Int64Column    => Try(jsonNode.at(jsonPointer).asLong()).getOrElse(null)
        case _: UInt64Column   => Try(jsonNode.at(jsonPointer).asLong()).getOrElse(null)
      }
    })
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

  private def ensureTableSchema(tableSchema: TableSchema, destinations: Seq[DataDestination]): Unit = {
    info(s"schema: $tableSchema")
    destinations.foreach {
      case DataDestination.Clickhouse =>
        schemaService.createOrMergeTableSchema(tableSchema).sync()
      case DataDestination.Hadoop =>
    }
  }
}
