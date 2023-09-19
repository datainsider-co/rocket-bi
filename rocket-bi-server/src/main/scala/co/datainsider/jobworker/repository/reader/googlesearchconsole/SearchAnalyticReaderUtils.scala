package co.datainsider.jobworker.repository.reader.googlesearchconsole

import co.datainsider.jobworker.domain.SyncMode
import co.datainsider.jobworker.domain.job.GoogleSearchConsoleJob
import co.datainsider.jobworker.util.DateTimeUtils
import co.datainsider.schema.domain.column.{Column, DoubleColumn}
import com.google.api.client.http.HttpResponseException
import com.google.api.services.searchconsole.v1.SearchConsole
import com.google.api.services.searchconsole.v1.model.{SearchAnalyticsQueryRequest, SearchAnalyticsQueryResponse}
import com.twitter.util.logging.Logging
import datainsider.client.exception.InternalError

import java.sql.Date
import java.util.concurrent.ThreadLocalRandom
import scala.util.control.Breaks.{break, breakable}

/**
  * created 2023-09-06 4:31 PM
  *
  * @author tvc12 - Thien Vi
  */
object SearchAnalyticReaderUtils extends Logging {

  val DATE_COLUMN_NAME = "date"
  val SEARCH_APPEARANCE_COLUMN_NAME = "search_appearance"
  val QUERY_COLUMN_NAME = "query"
  val PAGE_COLUMN_NAME = "page"
  val COUNTRY_COLUMN_NAME = "country"
  val DEVICE_COLUMN_NAME = "device"

  val CLICKS_COLUMN_NAME = "clicks"
  val IMPRESSIONS_COLUMN_NAME = "impressions"
  val CTR_COLUMN_NAME = "ctr"
  val POSITION_COLUMN_NAME = "position"
  def getMetricColumns(): Seq[Column] = {
    Seq(
      DoubleColumn(name = CLICKS_COLUMN_NAME, displayName = CLICKS_COLUMN_NAME, isNullable = true),
      DoubleColumn(name = IMPRESSIONS_COLUMN_NAME, displayName = IMPRESSIONS_COLUMN_NAME, isNullable = true),
      DoubleColumn(name = CTR_COLUMN_NAME, displayName = CTR_COLUMN_NAME, isNullable = true),
      DoubleColumn(name = POSITION_COLUMN_NAME, displayName = POSITION_COLUMN_NAME, isNullable = true)
    )
  }

  def executeSearchRequest(
      searchAnalytics: SearchConsole#Searchanalytics,
      siteUrl: String,
      request: SearchAnalyticsQueryRequest,
      maxRetryTimes: Int
  ): SearchAnalyticsQueryResponse = {
    var response: SearchAnalyticsQueryResponse = null
    breakable {
      for (retryTimes <- 0 until maxRetryTimes) {
        try {
          logger.debug(s"executeSearchRequest::Execute search request with ${request} in ${retryTimes} times")
          val query: SearchConsole#Searchanalytics#Query = searchAnalytics.query(siteUrl, request)
          query.setPrettyPrint(false)
          response = query.execute()
          logger.debug(s"executeSearchRequest::Execute search request successfully.")
          break
        } catch {
          case ex: HttpResponseException if (isRetryable(ex)) => {
            logger.debug(s"Cannot execute search request cause ${ex.getMessage} in ${retryTimes} times")
            val sleepTimeMs: Long = Math.pow(2, retryTimes).toInt * 1000 + ThreadLocalRandom.current().nextLong(5000, 10000)
            Thread.sleep(sleepTimeMs)
          }
        }
      }
    }

    if (response == null) {
      throw InternalError(s"Cannot execute search request after ${maxRetryTimes} times")
    }

    response
  }



  private def isRetryable(ex: HttpResponseException): Boolean = {
    ex.getStatusCode == 429 || ex.getStatusCode == 500 || ex.getStatusCode == 503
  }

  def calculateToDateAsString(job: GoogleSearchConsoleJob): String = {
    DateTimeUtils.formatDate(calculateToDate(job))
  }

  def calculateToDate(job: GoogleSearchConsoleJob): Date = {
    if (isIncrementalMode(job)) {
      DateTimeUtils.getYesterday()
    } else {
      job.dateRange.calculateToDate()
    }
  }

  def calculateFromDateAsString(job: GoogleSearchConsoleJob): String = {
    DateTimeUtils.formatDate(calculateFromDate(job))
  }

  def calculateFromDate(job: GoogleSearchConsoleJob): Date = {
    if (isIncrementalMode(job) && job.lastSyncedValue.isDefined) {
      DateTimeUtils.parseToDate(job.lastSyncedValue.get).get
    } else {
      job.dateRange.calculateFromDate()
    }
  }

  def isIncrementalMode(job: GoogleSearchConsoleJob): Boolean = {
    job.syncMode == SyncMode.IncrementalSync
  }
}
