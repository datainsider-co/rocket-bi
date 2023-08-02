package co.datainsider.jobworker.repository.reader.tiktok

import co.datainsider.jobworker.domain.SyncMode
import co.datainsider.jobworker.domain.job.TikTokAdsJob
import co.datainsider.jobworker.exception.ReaderException
import co.datainsider.jobworker.repository.reader.Reader
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import datainsider.client.util.JsonParser
import co.datainsider.bi.client.JdbcClient.Record

import java.sql.Timestamp
import java.text.SimpleDateFormat
import java.util.Date
import scala.annotation.tailrec
import scala.util.Try

class TikTokAdsReader(job: TikTokAdsJob, client: TikTokClient, columns: Seq[Column], parser: TikTokRecordParser)
    extends Reader
    with Logging {

  private var curRow: Int = 0
  private var tikTokData: TikTokAdsData = null
  private val retryTimeOutAsMilli = 1000

  init()

  private def buildRequestParams(job: TikTokAdsJob, page: Int): Map[String, String] = {
    val params = Map(
      "page" -> page.toString,
      "advertiser_id" -> job.advertiserId,
      "field" -> JsonParser.toJson(columns.map(_.name))
    )
    params
  }

  private def ensureTikTokResponse(response: TikTokResponse[TikTokAdsData]): Unit = {
    if (response.isError() || !response.data.isValidData()) {
      throw new ReaderException(response.message)
    }
  }

  @tailrec
  private def getTikTokAdsData(
      job: TikTokAdsJob,
      page: Int,
      retryCount: Int = 0,
      maxRetryTimes: Int = 3
  ): TikTokAdsData = {
    try {
      val requestParamsMap: Map[String, String] = buildRequestParams(job, page)
      val response = client.get[TikTokResponse[TikTokAdsData]](endPoint = job.tikTokEndPoint, params = requestParamsMap.toSeq)
      ensureTikTokResponse(response)
      response.data
    } catch {
      case e: Throwable =>
        logger.error(s"TikTokAdsReader::getTikTokAdsData:: retryTime:${retryCount}. Error message:${e.getMessage}", e)
        if (retryCount < maxRetryTimes) {
          Thread.sleep(retryTimeOutAsMilli)
          getTikTokAdsData(job, page, retryCount + 1)
        } else throw new ReaderException(e.getMessage, e)
    }
  }

  protected def init(): Unit = {
    val firstPage = 1
    tikTokData = getTikTokAdsData(job, firstPage)
  }

  override def hasNext(): Boolean = hasNextRow() || hasNextPage()

  private def hasNextPage(): Boolean = tikTokData.pageInfo.hasNextPage

  private def hasNextRow(): Boolean = curRow < tikTokData.list.length

  private def loadNext() = {
    if (!hasNextRow() && hasNextPage()) {
      tikTokData = getTikTokAdsData(job, tikTokData.pageInfo.page + 1)
      curRow = 0
    }
    if (!hasNextRow() && !hasNextPage()) throw new ReaderException("no more data to read")
  }

  override def next(columns: Seq[Column]): Seq[Record] = {
    loadNext()
    val record: Array[Any] = columns.map(column => {
      val recordCell: JsonNode = tikTokData.list(curRow).get(column.name)
      Try(parser.parse(column, recordCell)).getOrElse(null)
    }).toArray
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

  override def getLastSyncValue(): Option[String] = None

}
