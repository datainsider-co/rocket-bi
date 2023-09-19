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
import com.twitter.util.logging.Logging

import java.sql.Date
import java.util
import javax.validation.constraints.Max
import scala.collection.mutable.ArrayBuffer
import scala.jdk.CollectionConverters.seqAsJavaListConverter
import scala.util.Try

/**
  * created 2023-09-05 6:29 PM
  *
  * @author tvc12 - Thien Vi
  */
class SearchAnalyticReader(
    searchConsole: SearchConsole,
    job: GoogleSearchConsoleJob,
    @Max(25000) batchSize: Int = 25000,
    maxRetryTimes: Int = 5
) extends Reader
    with Logging {

  private val dimensionList = Seq(
    SearchAnalyticReaderUtils.DATE_COLUMN_NAME,
    SearchAnalyticReaderUtils.QUERY_COLUMN_NAME,
    SearchAnalyticReaderUtils.PAGE_COLUMN_NAME,
    SearchAnalyticReaderUtils.COUNTRY_COLUMN_NAME,
    SearchAnalyticReaderUtils.DEVICE_COLUMN_NAME
  )

  private val searchAnalytics: SearchConsole#Searchanalytics = searchConsole.searchanalytics()
  private var lastSyncedValue: Option[String] = job.lastSyncedValue
  private var from: Int = 0
  private var canNext = true
  // dimension name -> index. This use for reverse value at ApiDataRow
  private var dimensionIndexMap: Map[String, Int] = Map.empty
  init()

  protected def init(): Unit = {
    dimensionIndexMap = dimensionList.zipWithIndex.toMap
    lastSyncedValue = Some(SearchAnalyticReaderUtils.calculateToDateAsString(job))
  }

  override def hasNext(): Boolean = canNext

  override def next(columns: Seq[Column]): Seq[Record] = {
    try {
      val request: SearchAnalyticsQueryRequest = buildSearchAnalyticsRequest(job, from)
      ensureRequest(request, job)
      val response: SearchAnalyticsQueryResponse = SearchAnalyticReaderUtils.executeSearchRequest(
        searchAnalytics = searchAnalytics,
        siteUrl = job.siteUrl,
        request = request,
        maxRetryTimes = maxRetryTimes
      )
      val rows: util.List[ApiDataRow] = Option(response.getRows).getOrElse(new util.ArrayList[ApiDataRow])
      from += batchSize
      val records = ArrayBuffer.empty[Record]

      rows.forEach(row => {
        val record: Record = toRecord(row, columns)
        records += record
      })
      if (records.isEmpty || records.size < batchSize) {
        canNext = false
      }
      records
    } catch {
      case ex: ReaderException => throw ex
      case ex: Throwable       => throw new ReaderException(s"Cannot create SearchAnalyticReader cause ${ex.getMessage}", ex)
    }
  }

  private def buildSearchAnalyticsRequest(job: GoogleSearchConsoleJob, from: Int): SearchAnalyticsQueryRequest = {
    val request = new SearchAnalyticsQueryRequest()
    request.setStartDate(SearchAnalyticReaderUtils.calculateFromDateAsString(job))
    request.setEndDate(SearchAnalyticReaderUtils.calculateToDateAsString(job))
    val config: SearchAnalyticsConfig = job.searchAnalyticsConfig
    request.setDimensions(dimensionList.asJava)
    request.setRowLimit(batchSize)
    request.setStartRow(from)
    config.dataState.foreach(request.setDataState)
    request.setType(config.`type`)
    request
  }

  private def ensureRequest(request: SearchAnalyticsQueryRequest, job: GoogleSearchConsoleJob): Unit = {
    val lastSyncValue = job.lastSyncedValue.getOrElse("")
    if (
      isIncrementalMode() && job.lastSyncedValue.isDefined && request.getEndDate == lastSyncValue && request.getStartDate == request.getEndDate
    ) {
      throw CompletedReaderException("Read data completed")
    }
  }

  private def toRecord(row: ApiDataRow, columns: Seq[Column]): Record = {
    columns
      .map(col => {
        col.name match {
          case SearchAnalyticReaderUtils.DATE_COLUMN_NAME        => parseToDate(getDimensionValue(row, col.name))
          case SearchAnalyticReaderUtils.QUERY_COLUMN_NAME       => getDimensionValue(row, col.name)
          case SearchAnalyticReaderUtils.PAGE_COLUMN_NAME        => getDimensionValue(row, col.name)
          case SearchAnalyticReaderUtils.DEVICE_COLUMN_NAME      => getDimensionValue(row, col.name)
          case SearchAnalyticReaderUtils.COUNTRY_COLUMN_NAME     => getDimensionValue(row, col.name)
          case SearchAnalyticReaderUtils.CLICKS_COLUMN_NAME      => row.getClicks
          case SearchAnalyticReaderUtils.IMPRESSIONS_COLUMN_NAME => row.getImpressions
          case SearchAnalyticReaderUtils.CTR_COLUMN_NAME         => row.getCtr
          case SearchAnalyticReaderUtils.POSITION_COLUMN_NAME    => row.getPosition
          case _                                                 => null
        }
      })
      .toArray
  }

  private def parseToDate(value: Any): Option[Date] = {
    try {
      if (value != null) {
        DateTimeUtils.parseToDate(String.valueOf(value))
      } else {
        None
      }
    } catch {
      case _: Throwable => null
    }
  }

  private def getDimensionValue(row: ApiDataRow, dimension: String): Any = {
    val index: Option[Int] = dimensionIndexMap.get(dimension)
    if (index.isEmpty) {
      null
    } else {
      row.getKeys.get(index.get)
    }
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
    dimensionList.map {
      case name @ SearchAnalyticReaderUtils.DATE_COLUMN_NAME =>
        DateColumn(name = name, displayName = name, isNullable = true)
      case name @ _ => StringColumn(name = name, displayName = name, isNullable = true)
    }
  }

  override def close(): Unit = {}

  override def getLastSyncValue(): Option[String] = lastSyncedValue

  override def isIncrementalMode(): Boolean = SearchAnalyticReaderUtils.isIncrementalMode(job)
}
