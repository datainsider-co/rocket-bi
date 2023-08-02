package co.datainsider.jobworker.repository.reader.ga

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.jobworker.domain.SyncMode
import co.datainsider.jobworker.domain.job.{GaDateRange, GaDimension, GaJob, GaMetric}
import co.datainsider.jobworker.exception.{CompletedReaderException, CreateReaderException}
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.service.worker.DepotAssistant
import com.google.api.client.googleapis.json.GoogleJsonResponseException
import com.google.api.services.analyticsreporting.v4.AnalyticsReporting
import com.google.api.services.analyticsreporting.v4.model._
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import io.netty.util.internal.ThreadLocalRandom

import java.text.SimpleDateFormat
import java.util.Calendar
import scala.jdk.CollectionConverters.{asScalaBufferConverter, seqAsJavaListConverter}
import scala.util.control.Breaks._

/**
  * created 2023-02-20 4:56 PM
  *
  * @author tvc12 - Thien Vi
  */
class GaReader(analyticsReporting: AnalyticsReporting, job: GaJob, batchSize: Int = 100000, maxRetryTimes: Int = 5) extends Reader with Logging {
  private var currentReport: Option[Report] = None
  private var currentRowIndex: Int = 0
  // offset of row in total
  private var currentRowOffset: Int = 0
  private var totalRows: Int = 0
  private var currentSyncedValue: Option[String] = None
  private val retryReasonList = Set("userRateLimitExceeded", "rateLimitExceeded", "quotaExceeded", "internalServerError", "backendError", "serviceUnavailable")
  private val gaDateFormat = new SimpleDateFormat("yyyy-MM-dd")


  init()
  protected def init(): Unit = {
    try {
      currentReport = getReportWithRetry()
      totalRows = currentReport match {
        case Some(report) => report.getData.getRowCount
        case None => 0
      }
      currentSyncedValue = calculateLastSyncedValue(currentReport)
      logger.info(s"init reader of ga success, last synced value: ${currentSyncedValue}")
      currentRowIndex = 0
      currentRowOffset = 0
    } catch {
      case ex: Throwable => {
        logger.error(s"init reader of ga failure, cause ${ex.getMessage}", ex)
        throw CreateReaderException(s"init reader of google analytics failed, cause ${ex.getMessage}", ex)
      }
    }
  }

  private def calculateLastSyncedValue(report: Option[Report]): Option[String] = {
    if (report.isDefined && isIncrementalMode()) {
      return Some(getYesterdayString())
    } else {
      return None
    }
  }

  /**
   * ensure get report with retry implement
   * https://developers.google.com/analytics/devguides/reporting/core/v4/limits-quotas#additional_quota
   */
  private def getReportWithRetry(pageToken: Option[String] = None, maxRetry: Int = 5): Option[Report] = {
    var report: Option[Report] = None
    breakable {

      for (retryTime <- 0 to maxRetry) {
        try {
          logger.info(s"get report with retry times ${retryTime}")
          report = getReport(pageToken)
          break
        } catch {
          case ex: GoogleJsonResponseException if (isRetryRequest(ex)) => {
            val sleepTime: Long = Math.pow(2L,  retryTime).toLong + ThreadLocalRandom.current().nextLong(0, 1000)
            logger.info(s"Request failed, cause ${ex.getMessage}, sleep in ${sleepTime}ms...")
            Thread.sleep(sleepTime)
          }
          case ex: Throwable => {
            logger.error(s"getReportWithRetry stopped, cause ${ex.getMessage}")
            throw ex
          }
        }
      }
    }
    report
  }

  private def isRetryRequest(exception: GoogleJsonResponseException): Boolean = {
    try {
      val reason = exception.getDetails.getErrors.asScala.head.getReason
      logger.info(s"isRetryRequest::reason: ${reason}")
      retryReasonList.contains(reason)
    } catch {
      case ex: Throwable => {
        logger.error(s"isRetryRequest::error: ${ex.getMessage}")
        false
      }
    }
  }

  private def getReport(pageToke: Option[String]): Option[Report] = {
    logger.info(s"getReport with page token: ${pageToke}")
    val request: ReportRequest = buildReportRequest(job)
    pageToke.foreach(request.setPageToken)
    val response: GetReportsResponse = analyticsReporting
      .reports()
      .batchGet(
        new GetReportsRequest().setReportRequests(List(request).asJava)
      )
      .execute()
    // expect 1 response report returned, cause we only send 1 request in batch
    response.getReports.asScala.headOption
  }

  override def hasNext(): Boolean = {
    currentRowOffset < totalRows
  }

  /**
    * get next record by columns. Thu tu tra ve cua cac cot phai giong thu tu cua trong columns
    */
  override def next(columns: Seq[Column]): Seq[Record] = {
    try {
      ensureHasData()
      val row: ReportRow = currentReport.get.getData.getRows.get(currentRowIndex)
      val record: Record = toRecord(row)
      Seq(record)
    } finally {
      currentRowOffset += 1
      currentRowIndex += 1
    }
  }

  private def ensureHasData() = {
    if (currentReport.isEmpty) {
      throw new CompletedReaderException("reader already completed")
    }
    if (hasNext() && isMustLoadMore(currentReport.get)) {
      loadMoreData(currentReport.get.getNextPageToken)
    }
  }

  @throws[CompletedReaderException]("if next page token is null")
  private def loadMoreData(nextPageToken: String): Unit = {
    logger.info(s"load more data with page token ${nextPageToken}")
    if (nextPageToken != null && nextPageToken.nonEmpty) {
      currentReport = getReportWithRetry(Some(nextPageToken))
      currentRowIndex = 0
      logger.info("load more data success")
      // ensure report is exists
      if (currentReport.isEmpty) {
        throw new CompletedReaderException("reader already completed")
      }
    } else {
      throw new CompletedReaderException("reader already completed")
    }
  }

  private def isMustLoadMore(report: Report): Boolean = {
    currentRowIndex >= report.getData.getRows.size()
  }

  private def toRecord(row: ReportRow): Record = {
    val dimensions: Seq[String] = row.getDimensions.asScala
    val values: Seq[String] = row.getMetrics.asScala.flatMap(_.getValues.asScala)
    (dimensions ++ values).toArray
  }

  private def buildReportRequest(job: GaJob): ReportRequest = {
    val reportRequest: ReportRequest = new ReportRequest()
      .setViewId(job.viewId)
      .setMetrics(toMetrics(job.metrics).asJava)
      .setDimensions(toDimensions(job.dimensions).asJava)
      .setOrderBys(toOrderBys(job.sorts).asJava)
      .setPageSize(batchSize)
    val finalReportRequest: ReportRequest = setupDateRanges(job, reportRequest)
    finalReportRequest
  }

  private def setupDateRanges(job: GaJob, reportRequest: ReportRequest): ReportRequest = {
    if (isIncrementalMode() && isNullOrEmpty(job.lastSyncedValue)) {
      setupDateRangesFirstTime(job, reportRequest)
    } else if (isIncrementalMode() && !isNullOrEmpty(job.lastSyncedValue)) {
      setupDateRangesIncremental(reportRequest, job.lastSyncedValue)
    } else {
      reportRequest.setDateRanges(toDateRanges(job.dateRanges).asJava)
    }
    reportRequest
  }

  /**
   * get yesterday of current date, with format yyyy-MM-dd
   */
  private def getYesterdayString(): String = {
    val calendar = Calendar.getInstance()
    calendar.add(Calendar.DATE, -1)
    gaDateFormat.format(calendar.getTime)
  }

  private def setupDateRangesFirstTime(job: GaJob, reportRequest: ReportRequest): ReportRequest = {
    val startTime: Option[String] = job.dateRanges.headOption.map(_.startDate)
    val dateRange = new DateRange()
      .setStartDate(startTime.orNull)
      .setEndDate(getYesterdayString())
    reportRequest.setDateRanges(List(dateRange).asJava)
  }

  private def setupDateRangesIncremental(reportRequest: ReportRequest, lastSyncedValue: String): ReportRequest = {
    val dateRange = new DateRange()
      .setStartDate(lastSyncedValue)
      .setEndDate(getYesterdayString())
    reportRequest.setDateRanges(List(dateRange).asJava)
  }

  private def isNullOrEmpty(lastSyncedValue: String): Boolean = {
    lastSyncedValue == null || lastSyncedValue.isEmpty
  }

  private def toDateRanges(dateRanges: Array[GaDateRange]): List[DateRange] = {
    dateRanges
      .map(dateRange => {
        new DateRange()
        .setStartDate(dateRange.startDate)
        .setEndDate(dateRange.endDate)
      })
      .toList
  }

  private def toMetrics(metrics: Array[GaMetric]): List[Metric] = {
    metrics
      .map(f => {
        new Metric()
          .setExpression(f.expression)
          .setAlias(f.alias)
      })
      .toList
  }

  private def toDimensions(dimensions: Array[GaDimension]): List[Dimension] = {
    dimensions
      .map(dimension => {
        new Dimension()
          .setName(dimension.name)
          .setHistogramBuckets(dimension.histogramBuckets.map(long2Long).toList.asJava)
      })
      .toList
  }

  private def toOrderBys(sorts: Seq[String]): List[OrderBy] = {
    sorts
      .map(field => {
        if (field.startsWith("-")) {
          new OrderBy()
            .setFieldName(field.substring(1))
            .setSortOrder("DESCENDING")
        } else {
          new OrderBy()
            .setFieldName(field)
            .setSortOrder("ASCENDING")
        }
      })
      .toList
  }

  override def detectTableSchema(): TableSchema = {
    val dimensionColumns: Array[Column] = job.dimensions.map(toDimensionColumn)
    val metricColumns: Array[Column] = job.metrics.map(toMetricColumn)
    TableSchema(
      dbName = job.destDatabaseName,
      name = job.destTableName,
      organizationId = job.orgId,
      displayName = job.destTableName,
      columns = dimensionColumns ++ metricColumns
    )
  }

  private def toMetricColumn(metric: GaMetric): Column = {
    DepotAssistant
      .ColumnBuilder(metric.alias)
      .setDisplayName(metric.expression)
      .setDataType(metric.dataType)
      .build()
  }

  private def toDimensionColumn(dimension: GaDimension): Column = {
    DepotAssistant
      .ColumnBuilder(dimension.name.replaceAll(":", "_")) // convert ga:dimension1 to ga_dimension1
      .setDisplayName(dimension.name)
      .String
      .build()
  }

  override def close(): Unit = {
    // do nothing
  }

  override def isIncrementalMode(): Boolean = {
    job.syncMode == SyncMode.IncrementalSync
  }

  override def getLastSyncValue(): Option[String] = currentSyncedValue
}
