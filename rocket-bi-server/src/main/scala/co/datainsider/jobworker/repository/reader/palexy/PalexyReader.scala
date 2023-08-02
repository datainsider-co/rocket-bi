package co.datainsider.jobworker.repository.reader.palexy

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.jobworker.client.palexy.{PalexyClient, PalexyResponse}
import co.datainsider.jobworker.domain.job.PalexyJob
import co.datainsider.jobworker.domain.{RangeValue, SyncMode}
import co.datainsider.jobworker.exception.CompletedReaderException
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.util.DateTimeUtils
import co.datainsider.jobworker.util.JsonUtils.ImplicitJsonNode
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging

import java.sql.Date

/**
  * created 2023-07-10 5:42 PM
  *
  * @author tvc12 - Thien Vi
  */
class PalexyReader(client: PalexyClient, apiKey: String, palexyJob: PalexyJob, windowDays: Int = 30, maxRetryTimes: Int = 3, retryIntervalMs: Int = 1000) extends Reader with Logging {
  private val clazz = getClass.getSimpleName
  private val DATE_COLUMN_PATTERNS = Set("day")
  private var lastSyncedValue: Option[String] = {
    if (palexyJob.lastSyncedValue.isDefined && palexyJob.lastSyncedValue.get.nonEmpty) {
      palexyJob.lastSyncedValue
    } else {
      None
    }
  }
  private val syncDateRangeIterator: Iterator[RangeValue[Date]] = calculateSyncDateList(palexyJob).toIterator
  var hasNext: Boolean = true

  /**
    * split sync date list into small window days
    */
  private def calculateSyncDateList(palexyJob: PalexyJob): Seq[RangeValue[Date]] = {
    if (this.isIncrementalMode()) {
      val lastSyncedDate: Date = lastSyncedValue match {
        case Some(value) => DateTimeUtils.parseToDate(value).getOrElse(palexyJob.dateRange.calculateFromDate())
        case _           => palexyJob.dateRange.calculateFromDate()
      }
      val toDate: Date = DateTimeUtils.getYesterday()
      DateTimeUtils.splitDateRanges(lastSyncedDate, toDate, windowDays)
    } else {
      val fromDate: Date = palexyJob.dateRange.calculateFromDate()
      val toDate: Date = palexyJob.dateRange.calculateToDate()
      DateTimeUtils.splitDateRanges(fromDate, toDate, windowDays)
    }
  }
  override def next(columns: Seq[Column]): Seq[Record] = Profiler(s"[Reader] ${clazz}::next"){
    if (syncDateRangeIterator.hasNext) {
      val syncDateRange: RangeValue[Date] = syncDateRangeIterator.next()
      hasNext = syncDateRangeIterator.hasNext
      val response: PalexyResponse = getPalexyResponse(syncDateRange)
      lastSyncedValue = Some(syncDateRange.to.toString)
      toRecords(response, columns)
    } else {
      hasNext = false
      throw CompletedReaderException("PalexyReader is completed")
    }
  }

  /**
   * get palexy response from palexy client with retry
   */
  private def getPalexyResponse(syncDateRange: RangeValue[Date]): PalexyResponse = {
    var retryTimes = 0
    var response: PalexyResponse = null
    while (retryTimes < maxRetryTimes) {
      try {
        response = client.getStoreReport(
          apiKey = apiKey,
          metrics = palexyJob.metrics,
          dimensions = palexyJob.dimensions,
          fromDate = syncDateRange.from,
          toDate = syncDateRange.to
        )
        retryTimes = maxRetryTimes
      } catch {
        case ex: Exception => {
          logger.error(s"Cannot get palexy response after $retryTimes times", ex)
          retryTimes += 1
          Thread.sleep(retryIntervalMs)
        }
      }
    }
    if (response == null) {
      throw new RuntimeException(s"Cannot get palexy response after $maxRetryTimes times")
    } else {
      response
    }
  }

  private def toRecords(response: PalexyResponse, columns: Seq[Column]): Seq[Record] = {
    response.rows.map((row: JsonNode) => {
      columns.toArray.map((col: Column) => {
        try {
          col match {
            case col: BoolColumn       => row.getBoolean(col.name)
            case col: UInt8Column      => row.getInt(col.name)
            case col: UInt16Column     => row.getInt(col.name)
            case col: UInt32Column     => row.getLong(col.name)
            case col: UInt64Column     => row.getLong(col.name)
            case col: Int8Column       => row.getInt(col.name)
            case col: Int16Column      => row.getInt(col.name)
            case col: Int32Column      => row.getInt(col.name)
            case col: Int64Column      => row.getLong(col.name)
            case col: FloatColumn      => row.getFloat(col.name)
            case col: DoubleColumn     => row.getDouble(col.name)
            case col: DateColumn       => DateTimeUtils.toSqlDate(row.getString(col.name)).getTime
            case col: DateTimeColumn   => DateTimeUtils.toSqlTimestamp(row.getString(col.name)).getTime
            case col: DateTime64Column => DateTimeUtils.toSqlTimestamp(row.getString(col.name)).getTime
            case col: StringColumn     => row.getString(col.name)
            case _                     => row.getString(col.name)
          }
        } catch {
          case _: Throwable => null
        }
      })
    })
  }

  override def detectTableSchema(): TableSchema = {
    val dimensionColumns: Seq[Column] = toDimensionColumns(palexyJob.dimensions)
    val metricColumns: Seq[Column] = toMetricColumns(palexyJob.metrics)
    TableSchema(
      organizationId = palexyJob.orgId,
      dbName = palexyJob.destDatabaseName,
      name = palexyJob.destTableName,
      displayName = palexyJob.destTableName,
      columns = dimensionColumns ++ metricColumns
    )
  }

  private def toDimensionColumns(dimensions: Set[String]): Seq[Column] = {
    dimensions.map { dimension =>
      {
        if (DATE_COLUMN_PATTERNS.contains(dimension)) {
          DateColumn(name = dimension, displayName = dimension)
        } else {
          StringColumn(name = dimension, displayName = dimension)
        }
      }
    }.toSeq
  }

  private def toMetricColumns(metrics: Set[String]): Seq[Column] = {
    metrics.map { metric =>
      DoubleColumn(name = metric, displayName = metric)
    }.toSeq
  }

  override def close(): Unit = {}

  override def isIncrementalMode(): Boolean = palexyJob.syncMode == SyncMode.IncrementalSync

  override def getLastSyncValue(): Option[String] = lastSyncedValue
}
