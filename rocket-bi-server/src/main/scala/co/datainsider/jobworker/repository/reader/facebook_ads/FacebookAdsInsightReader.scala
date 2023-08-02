package co.datainsider.jobworker.repository.reader.facebook_ads

import co.datainsider.jobworker.domain.SyncMode
import co.datainsider.jobworker.domain.job.{FacebookAdsJob, FacebookAdsTimeRange}
import co.datainsider.jobworker.exception.{CompletedReaderException, ReaderException}
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.util.JsonUtils
import com.facebook.ads.sdk._
import com.google.gson.{JsonElement, JsonObject}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import datainsider.client.util.JsonParser
import co.datainsider.bi.client.JdbcClient.Record

import java.sql.Timestamp
import java.text.SimpleDateFormat
import java.util
import java.util.Date
import scala.collection.mutable.ArrayBuffer
import scala.util.Try

case class AdsActionStatisticsResult(actionType: String, value: Double)

/**
  *@throws UnsupportedOperationException when tableName of job is not supported
  */
class FacebookAdsInsightReader(
    job: FacebookAdsJob,
    request: AdAccount.APIRequestGetInsights,
    columns: Seq[Column],
    timeRanges: Seq[FacebookAdsTimeRange],
    sleepTime: Int = 10000,
    maxRetryTime: Int = 3
) extends Reader
    with Logging {
  private var lastSyncValue: String = ""
  private var responseAsIterator: util.Iterator[AdsInsights] = null
  private val timeRangeAsIterator: Iterator[FacebookAdsTimeRange] = timeRanges.iterator
// ISO 8601
  private val DEFAULT_FORMATTER = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss")
  private val BUC_RATE_LIMIT_ERROR_CODE = "80000"
  private val USER_REQUEST_LIMIT_CODE = "17"
  private val ACTION_FIELDS: Set[String] = Set(
    "action_values",
    "actions",
    "catalog_segment_value",
    "conversion_values",
    "conversions",
    "converted_product_quantity",
    "converted_product_value",
    "cost_per_action_type",
    "cost_per_conversion",
    "cost_per_outbound_click",
    "cost_per_thruplay",
    "cost_per_unique_action_type",
    "cost_per_unique_outbound_click",
    "instant_experience_outbound_clicks",
    "mobile_app_purchase_roas",
    "outbound_clicks",
    "outbound_clicks_ctr",
    "purchase_roas",
    "total_postbacks_detailed",
    "video_30_sec_watched_actions",
    "video_avg_time_watched_actions",
    "video_p100_watched_actions",
    "video_p25_watched_actions",
    "video_p50_watched_actions",
    "video_p75_watched_actions",
    "video_p95_watched_actions",
    "video_play_actions",
    "website_ctr",
    "website_purchase_roas"
  )
  init()

  protected def init(): Unit = {
    if (!timeRangeAsIterator.hasNext) throw new ReaderException("no more time range to read")
    else this.responseAsIterator = executeRequest(timeRangeAsIterator.next())
  }

//number of request reach rate limit
  @throws[CompletedReaderException]
  @throws[ReaderException]
  private def executeRequest(timeRange: FacebookAdsTimeRange, retryTime: Int = 0): util.Iterator[AdsInsights] = {
    try {
      request.setTimeRange(JsonParser.toJson(timeRange))
      request.execute().withAutoPaginationIterator(true).iterator()
    } catch {
      case e: APIException =>
        val errorCode: String = e.getRawResponseAsJsonObject.getAsJsonObject("error").get("code").getAsString
        //https://developers.facebook.com/docs/graph-api/overview/rate-limiting#ads-insights
        //https://developers.facebook.com/docs/graph-api/overview/rate-limiting#error-codes-2
        if (errorCode.equals(BUC_RATE_LIMIT_ERROR_CODE)) {
          throw new CompletedReaderException(s"Reader has been suspended an hour :${e.getMessage}")
        }
        if (retryTime < maxRetryTime && errorCode.equals(USER_REQUEST_LIMIT_CODE)) {
          Thread.sleep(sleepTime)
          executeRequest(timeRange, retryTime + 1)
        } else {
          logger.error(s"FacebookAdsReader::init:: ${e.getMessage}")
          throw new ReaderException(e.getMessage)
        }
    }
  }

  override def hasNext(): Boolean = {
    responseAsIterator.hasNext || timeRangeAsIterator.hasNext
  }

  private def updateLastSyncValue(response: JsonObject): Unit =
    try {
      if (job.syncMode == SyncMode.IncrementalSync)
        this.lastSyncValue = response.get("date_stop").getAsString
    } catch {
      case _: Throwable => throw new InternalError("can not update last sync value")
    }

  private def loadNextData() = {
    //try get data of next time range when current response is empty
    while (!responseAsIterator.hasNext && timeRangeAsIterator.hasNext) {
      responseAsIterator = executeRequest(timeRangeAsIterator.next())
    }
  }

  override def next(columns: Seq[Column]): Seq[Record] = {
    loadNextData()
    val facebookAdsData = responseAsIterator.next()
    val records: Seq[Record] = toRecords(facebookAdsData.getRawResponseAsJsonObject, columns)
    updateLastSyncValue(facebookAdsData.getRawResponseAsJsonObject)
    records
  }

  override def detectTableSchema(): TableSchema = {

    TableSchema(
      name = job.destTableName,
      dbName = job.destDatabaseName,
      organizationId = job.orgId,
      displayName = job.destTableName,
      columns = columns
    )
  }

  override def close(): Unit = Unit

  override def isIncrementalMode(): Boolean = job.syncMode == SyncMode.IncrementalSync

  override def getLastSyncValue(): Option[String] = if (lastSyncValue.nonEmpty) Some(lastSyncValue) else None

  /**
    * @param recordAdsJson facebook ads data
    * @return action_types is appeared in facebook ads data
    */
  private def listActionTypes(recordAdsJson: JsonObject): Set[String] = {
    val actionTypes: Set[String] = ACTION_FIELDS
      .flatMap(field => {
        try {
          val json: String = recordAdsJson.get(field).toString
          JsonUtils.fromJson[Seq[AdsActionStatisticsResult]](json).map(_.actionType)
        } catch {
          case _: Throwable => //in case, field's value is null
            Seq.empty[String]
        }
      })
    actionTypes
  }

  /**
    *  get action value from ads_action_stats list
    * @param statisticsResultAsJson ads_action_stats json array
    * @param actionType action need to get value
    * @return value of action
    */
  private def getActionValue(statisticsResultAsJson: JsonElement, actionType: String): Option[Double] = {
    val statisticsResults: Seq[AdsActionStatisticsResult] =
      Try(JsonParser.fromJson[Seq[AdsActionStatisticsResult]](statisticsResultAsJson.toString)).getOrElse(Seq.empty)

    val actionResult: Option[AdsActionStatisticsResult] = statisticsResults.find(_.actionType.equals(actionType))
    actionResult.map(_.value)
  }

  private def parseRecordPerActionType(actionType: String, recordAsJson: JsonObject, columns: Seq[Column]): Record = {
    columns.map(column => {
      if (column.name.equals("action_type")) {
        actionType
      } else if (ACTION_FIELDS.contains(column.name)) {
        getActionValue(recordAsJson.get(column.name), actionType).getOrElse(null)
      } else if (recordAsJson.has(column.name)) {
        parseJsonToColumnType(column, recordAsJson.get(column.name))
      } else {
        null
      }
    }).toArray
  }

  private def toRecords(recordAsJson: JsonObject, columns: Seq[Column]): Seq[Record] = {
    val actionTypes: Set[String] = listActionTypes(recordAsJson)
    val records: ArrayBuffer[Record] = ArrayBuffer.empty[Record]
    actionTypes.foreach(actionType => {
      val record = parseRecordPerActionType(actionType, recordAsJson, columns)
      records.append(record)
    })
    records
  }

  private def parseJsonToColumnType(column: Column, element: JsonElement): Any = {
    if (!element.isJsonNull)
      column match {
        case _: Int8Column     => element.getAsByte
        case _: Int16Column    => element.getAsShort
        case _: Int32Column    => element.getAsInt
        case _: Int64Column    => element.getAsLong
        case _: UInt8Column    => element.getAsByte
        case _: UInt16Column   => element.getAsShort
        case _: UInt32Column   => element.getAsInt
        case _: UInt64Column   => element.getAsLong
        case _: FloatColumn    => element.getAsFloat
        case _: DoubleColumn   => element.getAsDouble
        case _: DateColumn     => getDataAsDate(element)
        case _: DateTimeColumn => getDataAsDateTime(element)
        case _: StringColumn   => getDataAsString(element)
        case _: BoolColumn     => element.getAsBoolean
        case _ =>
          warn(s"Column is not supported: $column")
          null
      }
    else null
  }

  private def getDataAsDateTime(element: JsonElement): Timestamp = {
    val dataTimeAsMillis = new Date(DEFAULT_FORMATTER.parse(element.getAsString).getTime).getTime
    new Timestamp(dataTimeAsMillis)
  }

  private def getDataAsDate(element: JsonElement): Date = DEFAULT_FORMATTER.parse(element.getAsString)

  private def getDataAsString(element: JsonElement): String = {
    if (element.isJsonObject || element.isJsonArray)
      element.toString
    else element.getAsString
  }
}
