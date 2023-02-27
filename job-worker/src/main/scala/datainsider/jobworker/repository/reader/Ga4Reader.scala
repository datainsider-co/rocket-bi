package datainsider.jobworker.repository.reader

import com.google.analytics.data.v1beta._
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.Column
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.job.{Ga4DateRange, Ga4Dimension, Ga4Job, Ga4Metric}
import datainsider.jobworker.exception.{AlreadyCompletedException, ReaderException}
import datainsider.jobworker.service.worker.DepotAssistant
import datainsider.common.profiler.Profiler
import datainsider.jobworker.domain.SyncMode

import scala.concurrent.ExecutionContext.Implicits.global
import scala.jdk.CollectionConverters.asScalaBufferConverter

trait Reader extends AutoCloseable {

  /**
   * init reader when create reader
   */
  @throws[ReaderException]("init reader failed")
  protected def init(): Unit

  def hasNext(): Boolean

  /**
   * get next record by columns. Thu tu tra ve cua cac cot phai giong thu tu cua trong columns
   */
  @throws[ReaderException]("get next record failed")
  @throws[AlreadyCompletedException]("mark already reader completed")
  def next(columns: Seq[Column]): Record

  def detectTableSchema(): TableSchema

  def close(): Unit

  def isIncrementalMode(): Boolean

  def getLastSyncValue(): Option[String]
}
class Ga4Reader(client: BetaAnalyticsDataClient, job: Ga4Job, batchSize: Int = 10000) extends Reader with Logging {

  var response: RunReportResponse = null
  var totalRows: Int = 0
  var currentRow: Int = 0
  var offset: Int = 0

  init()

  override def init(): Unit = Profiler(s"[Reader] ${getClass.getName}.init"){
    try {
      response = runReport(job, offset)
      totalRows = response.getRowCount
      currentRow = 0
    } catch {
      case ex: Throwable => throw new ReaderException(s"init reader failed, cause ${ex.getMessage}", ex)
    }
  }

  private def runReport(job: Ga4Job, offset: Long): RunReportResponse = {
    val requestBuilder = RunReportRequest.newBuilder().setProperty(s"properties/${job.propertyId}")
    addMetrics(requestBuilder, job.metrics)
    addDimensions(requestBuilder, job.dimensions)
    addDateRanges(requestBuilder, job.dateRanges)
    requestBuilder.setLimit(batchSize)
    requestBuilder.setOffset(offset)
    client.runReport(requestBuilder.build())
  }

  private def addMetrics(requestBuilder: RunReportRequest.Builder, metrics: Seq[Ga4Metric]): Unit = {
    metrics.foreach(metric => {
      requestBuilder.addMetrics(Metric.newBuilder().setName(metric.name).build())
    })
  }

  private def addDimensions(requestBuilder: RunReportRequest.Builder, dimensions: Seq[Ga4Dimension]): Unit = {
    dimensions.foreach(dimension => {
      requestBuilder.addDimensions(Dimension.newBuilder().setName(dimension.name).build())
    })
  }

  private def addDateRanges(builder: RunReportRequest.Builder, ranges: Array[Ga4DateRange]): Unit = {
    ranges.foreach(range => {
      builder.addDateRanges(DateRange.newBuilder().setStartDate(range.startDate).setEndDate(range.endDate).build())
    })
  }

  override def hasNext(): Boolean = Profiler(s"[Reader] ${getClass.getName}.hasNext") {
    offset + currentRow < totalRows
  }

  override def next(columns: Seq[Column]): Record = Profiler(s"[Reader] ${getClass.getName}.next"){
    try {
      val row: Row = response.getRows(currentRow)
      val record: Record = toRecord(row, columns)
      record
    } finally {
      currentRow += 1
      if (isLoadMoreData(response, offset)) {
        loadMoreData()
      }
    }
  }

  /**
   * Record duoc tra ra theo thu tu cua columns truyen vao.
   * dimension1 | dimension2 | metric1 | metric2
   */
  private def toRecord(row: Row, columns: Seq[Column]): Record = {
    val dimensionValueAsMap: Map[String, String] = job.dimensions.zipWithIndex.map {
      case (dimension, index) => dimension.name -> row.getDimensionValues(index).getValue
    }.toMap
    val metricValueAsMap: Map[String, String] = job.metrics.zipWithIndex.map {
      case (metric, index) => metric.name -> row.getMetricValues(index).getValue
    }.toMap

    columns.map(column => {
      if (dimensionValueAsMap.contains(column.name)) {
        dimensionValueAsMap(column.name)
      } else if (metricValueAsMap.contains(column.name)) {
        metricValueAsMap(column.name)
      } else null
    })
  }

  private def loadMoreData(): Unit = {
    try {
      offset += batchSize
      response = runReport(job, offset)
      currentRow = 0
    } catch {
      case ex: Throwable => throw new ReaderException(s"request more data failed, cause ${ex.getMessage}", ex)
    }
  }


  private def isLoadMoreData(response: RunReportResponse, offset: Long): Boolean = {
    currentRow >= batchSize && offset + currentRow < response.getRowCount
  }

  override def detectTableSchema(): TableSchema = Profiler(s"[Reader] ${getClass.getName}.detectTableSchema") {
    val metricColumns: Array[Column] = job.metrics.map(metric => toColumnFromMetric(metric))
    val dimensionColumns: Array[Column] = job.dimensions.map(dimension => toColumnFromDimension(dimension))
    TableSchema(
      name = job.destTableName,
      dbName = job.destDatabaseName,
      organizationId = job.orgId,
      displayName = job.destTableName,
      columns = dimensionColumns ++ metricColumns,
    )
  }

  private def toColumnFromMetric(metric: Ga4Metric): Column = {
    DepotAssistant
      .ColumnBuilder(metric.name)
      .setDisplayName(metric.name)
      .setDataType(metric.dataType)
      .build()
  }

  private def toColumnFromDimension(dimension: Ga4Dimension): Column = {
    DepotAssistant
      .ColumnBuilder(dimension.name)
      .setDisplayName(dimension.name)
      .String
      .build()
  }

  override def close(): Unit = Profiler(s"[Reader] ${getClass.getName}.close") {
    try {
      client.close()
    } catch {
      case ex: Throwable => logger.error(s"close reader failed, cause ${ex.getMessage}", ex)
    }
  }

  override def isIncrementalMode(): Boolean = job.syncMode == SyncMode.IncrementalSync

  override def getLastSyncValue(): Option[String] = None
}
