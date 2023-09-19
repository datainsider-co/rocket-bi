package co.datainsider.jobworker.repository.reader.googlesearchconsole

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.jobscheduler.domain.job.SearchAnalyticsConfig
import co.datainsider.jobworker.domain.job.GoogleSearchConsoleJob
import co.datainsider.jobworker.exception.{CompletedReaderException, ReaderException}
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.util.DateTimeUtils
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{Column, DateColumn, StringColumn}
import com.google.api.services.searchconsole.v1.SearchConsole
import com.google.api.services.searchconsole.v1.model.{ApiDataRow, SearchAnalyticsQueryRequest, SearchAnalyticsQueryResponse}
import com.twitter.finatra.validation.constraints.Max

import java.sql.Date
import java.util
import scala.collection.mutable.ArrayBuffer
import scala.jdk.CollectionConverters.seqAsJavaListConverter

/**
  * created 2023-09-06 4:11 PM
  *
  * @author tvc12 - Thien Vi
  */
class SearchAppearanceReader(
    searchConsole: SearchConsole,
    job: GoogleSearchConsoleJob,
    @Max(25000) batchSize: Int = 25000,
    maxRetryTimes: Int = 5
) extends Reader {
  private val SEARCH_APPEARANCE_INDEX = 0

  private val searchAnalytics: SearchConsole#Searchanalytics = searchConsole.searchanalytics()
  private var canNext = true
  private var lastSyncedValue: Option[String] = job.lastSyncedValue
  private var previousFromDate: Option[Date] = None
  // maximum request date that can be requested
  private var maximumToDate: Date = null

  init()

  def init(): Unit = {
    lastSyncedValue = Some(SearchAnalyticReaderUtils.calculateToDateAsString(job))
    maximumToDate = SearchAnalyticReaderUtils.calculateToDate(job)
  }

  override def hasNext(): Boolean = canNext

  override def next(columns: Seq[Column]): Seq[Record] = {
    try {
      val fromDate: Date = calculateFromDate(job, previousFromDate)
      val toDate: Date = DateTimeUtils.getNextDay(fromDate)
      ensureCanNext(job, fromDate, toDate)
      val request: SearchAnalyticsQueryRequest = buildSearchAnalyticsRequest(job, fromDate, toDate)
      val response: SearchAnalyticsQueryResponse = SearchAnalyticReaderUtils.executeSearchRequest(
        searchAnalytics = searchAnalytics,
        siteUrl = job.siteUrl,
        request = request,
        maxRetryTimes = maxRetryTimes
      )
      val records = ArrayBuffer.empty[Record]
      val rows: util.List[ApiDataRow] = Option(response.getRows).getOrElse(new util.ArrayList[ApiDataRow]())
      rows.forEach(row => {
        val record: Record = toRecord(row, fromDate, columns)
        records += record
      })
      canNext = toDate.before(maximumToDate)
      previousFromDate = Some(fromDate)
      records
    } catch {
      case ex: ReaderException => throw ex
      case ex: Throwable       => throw new ReaderException(s"Cannot create SearchAnalyticReader cause ${ex.getMessage}", ex)
    }
  }

  /**
    * calculate request date based on previous request date.
    */
  private def calculateFromDate(job: GoogleSearchConsoleJob, previousFromDate: Option[Date]): Date = {
    if (previousFromDate.isDefined) {
      DateTimeUtils.getNextDay(previousFromDate.get)
    } else {
      SearchAnalyticReaderUtils.calculateFromDate(job)
    }
  }

  /**
    * Ensure fromData < toDate and toDate <= maximumToDate
    */
  private def ensureCanNext(job: GoogleSearchConsoleJob, fromDate: Date, toDate: Date): Unit = {
    if (toDate.before(fromDate) || toDate.equals(fromDate)) {
      throw new ReaderException(s"fromDate: $fromDate must be before toDate: $toDate")
    }

    if (maximumToDate.before(toDate)) {
      throw CompletedReaderException("Read data completed")
    }
  }

  private def buildSearchAnalyticsRequest(
      job: GoogleSearchConsoleJob,
      fromDate: Date,
      toDate: Date
  ): SearchAnalyticsQueryRequest = {
    val request = new SearchAnalyticsQueryRequest()
    request.setStartDate(DateTimeUtils.formatDate(fromDate))
    request.setEndDate(DateTimeUtils.formatDate(toDate))
    val config: SearchAnalyticsConfig = job.searchAnalyticsConfig
    request.setDimensions(List(SearchAnalyticReaderUtils.SEARCH_APPEARANCE_COLUMN_NAME).asJava)
    request.setRowLimit(batchSize)
    config.dataState.foreach(request.setDataState)
    request.setType(config.`type`)
    request
  }

  private def toRecord(row: ApiDataRow, date: Date, columns: Seq[Column]): Record = {
    columns
      .map(col => {
        col.name match {
          case SearchAnalyticReaderUtils.DATE_COLUMN_NAME              => date.getTime
          case SearchAnalyticReaderUtils.SEARCH_APPEARANCE_COLUMN_NAME => row.getKeys.get(SEARCH_APPEARANCE_INDEX)
          case SearchAnalyticReaderUtils.CLICKS_COLUMN_NAME            => row.getClicks
          case SearchAnalyticReaderUtils.IMPRESSIONS_COLUMN_NAME       => row.getImpressions
          case SearchAnalyticReaderUtils.CTR_COLUMN_NAME               => row.getCtr
          case SearchAnalyticReaderUtils.POSITION_COLUMN_NAME          => row.getPosition
          case _                                                       => null
        }
      })
      .toArray
  }

  override def detectTableSchema(): TableSchema = {
    TableSchema(
      organizationId = job.orgId,
      name = job.destTableName,
      dbName = job.destDatabaseName,
      displayName = job.destTableName,
      columns = getDimensionColumns() ++ SearchAnalyticReaderUtils.getMetricColumns()
    )
  }

  private def getDimensionColumns(): Seq[Column] = {
    import SearchAnalyticReaderUtils.{DATE_COLUMN_NAME, SEARCH_APPEARANCE_COLUMN_NAME}
    Seq(
      DateColumn(name = DATE_COLUMN_NAME, displayName = DATE_COLUMN_NAME, isNullable = true),
      StringColumn(name = SEARCH_APPEARANCE_COLUMN_NAME, displayName = SEARCH_APPEARANCE_COLUMN_NAME, isNullable = true)
    )
  }

  override def close(): Unit = {}

  override def isIncrementalMode(): Boolean = SearchAnalyticReaderUtils.isIncrementalMode(job)

  override def getLastSyncValue(): Option[String] = lastSyncedValue
}
