package co.datainsider.jobworker.repository.reader.tiktok

import co.datainsider.jobworker.domain.SyncMode
import co.datainsider.jobworker.domain.job.{TikTokAdsJob, TikTokReport}
import co.datainsider.jobworker.repository.reader.Reader
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.val2Opt
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import datainsider.client.util.JsonParser
import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.jobworker.exception.{CompletedReaderException, ReaderException}

import scala.annotation.tailrec

class TikTokReportReader(
    job: TikTokAdsJob,
    client: TikTokClient,
    parser: TikTokRecordParser,
    baseParams: ReportParamsInfo,
    columns: Seq[Column],
    timeRanges: Seq[TikTokTimeRange],
    maxRetryTimes: Int = 3,
    retryTimeOutAsMilli: Long = 1000
) extends Reader
    with Logging {
  private var lastSyncValue: Option[String] = None
  private var curRow: Int = 0
  private var curTimeRangeIndex: Int = 0
  private var tikTokAdsData: TikTokAdsData = null

  init()

  private def ensureTikTokReport(tiktokReport: Option[TikTokReport]): Unit = {
    if (tiktokReport.isEmpty) throw new ReaderException("tiktok report is empty")
    if (timeRanges.isEmpty) throw new ReaderException("time ranges is empty")
    timeRanges.foreach(timeRange => if (!timeRange.isValid()) throw new ReaderException("time range is invalid"))
    if (!tiktokReport.get.isValid)
      throw new ReaderException("time range is invalid")
  }

  protected def init(): Unit = {
    ensureTikTokReport(job.tikTokReport)
    val requestParams = buildParams(job.advertiserId, baseParams, timeRanges(curTimeRangeIndex))
    tikTokAdsData = getTikTokAdsData(requestParams)
  }

  private def buildParams(
      advertiserId: String,
      baseParams: ReportParamsInfo,
      timeRange: TikTokTimeRange,
      page: Int = 1
  ): Map[String, String] = {
    val requestParams = Map[String, String](
      "metrics" -> JsonParser.toJson(baseParams.metricColumns.map(_.name)),
      "dimensions" -> JsonParser.toJson(baseParams.dimensions),
      "service_type" -> baseParams.serviceType,
      "report_type" -> baseParams.reportType,
      "data_level" -> baseParams.dataLevel,
      "start_date" -> timeRange.start,
      "advertiser_id" -> advertiserId,
      "end_date" -> timeRange.end,
      "page" -> page.toString
    )
    requestParams
  }

  private def ensureTikTokResponse(response: TikTokResponse[TikTokAdsData]): Unit = {
    if (response.isError() || !response.data.isValidData()) {
      throw new ReaderException(response.message)
    }
  }

  @tailrec
  private def getTikTokAdsData(
      params: Map[String, String],
      retryCount: Int = 0
  ): TikTokAdsData = {
    try {
      val response: TikTokResponse[TikTokAdsData] =
        client.get[TikTokResponse[TikTokAdsData]](endPoint = job.tikTokEndPoint, params = params.toSeq)
      ensureTikTokResponse(response)
      lastSyncValue = params.get("end_date")
      response.data
    } catch {
      case e: Throwable =>
        logger.error(s"TikTokAdsReader::getTikTokAdsData:: retryTime:${retryCount}. Error message:${e.getMessage}", e)
        if (retryCount < maxRetryTimes) {
          Thread.sleep(retryTimeOutAsMilli)
          getTikTokAdsData(params, retryCount + 1)
        } else throw new ReaderException(e.getMessage, e)
    }
  }

  private def loadNextPage(nextTimeRange: TikTokTimeRange, nextPage: Int = 1): Unit = {
    val nextPageParams = buildParams(job.advertiserId, baseParams, nextTimeRange, nextPage)
    tikTokAdsData = getTikTokAdsData(nextPageParams)
  }

  private def hasNextPage(): Boolean = tikTokAdsData.pageInfo.hasNextPage

  private def hasNextRow(): Boolean = curRow < tikTokAdsData.list.length

  override def hasNext(): Boolean = {
    hasNextRow() || hasNextPage() || curTimeRangeIndex < timeRanges.length
  }

  @tailrec
  private def loadNextTimeRange(nextIndex: Int): Unit = {
    if (nextIndex < timeRanges.length) {
      loadNextPage(timeRanges(nextIndex))
      if (tikTokAdsData.list.nonEmpty) curTimeRangeIndex = nextIndex else loadNextTimeRange(nextIndex + 1)
    } else {
      curTimeRangeIndex = nextIndex
      throw new CompletedReaderException("no more time range to load")
    }
  }

  private def loadNext(): Unit = {
    if (!hasNextRow() && hasNextPage()) {
      loadNextPage(timeRanges(curTimeRangeIndex), tikTokAdsData.pageInfo.page + 1)
      curRow = 0
    }
    if (!hasNextRow() && !hasNextPage()) {
      loadNextTimeRange(curTimeRangeIndex + 1)
      curRow = 0
    }

  }

  private def getRecordCell(jsonData: JsonNode, column: Column): Any = {
    val metricData: JsonNode = jsonData.get("dimensions")
    val dimensionData: JsonNode = jsonData.get("metrics")
    val cell: JsonNode =
      if (metricData.has(column.name)) metricData.get(column.name)
      else dimensionData.get(column.name)
    parser.parse(column, cell)
  }

  /**
    * @throws CompletedReaderException disable to continue reading
    */
  override def next(columns: Seq[Column]): Seq[Record] = {
    loadNext()
    val record: Array[Any] = columns.map(column => { getRecordCell(tikTokAdsData.list(curRow), column) }).toArray
    curRow = curRow + 1
    Seq(record)
  }

  override def detectTableSchema(): TableSchema =
    TableSchema(
      name = job.destTableName,
      dbName = job.destDatabaseName,
      organizationId = job.orgId,
      displayName = job.destTableName,
      columns = columns
    )

  override def close(): Unit = Unit

  override def isIncrementalMode(): Boolean = job.syncMode.equals(SyncMode.IncrementalSync)

  override def getLastSyncValue(): Option[String] = lastSyncValue
}
