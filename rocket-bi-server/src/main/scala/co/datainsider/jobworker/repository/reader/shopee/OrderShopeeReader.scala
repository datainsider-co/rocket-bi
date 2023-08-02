package co.datainsider.jobworker.repository.reader.shopee

import co.datainsider.jobworker.client.shopee.{Order, ShopeeClient}
import co.datainsider.jobworker.domain.{RangeValue, SyncMode}
import co.datainsider.jobworker.domain.job.ShopeeJob
import co.datainsider.jobworker.exception.CompletedReaderException
import co.datainsider.jobworker.repository.reader.Reader
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import co.datainsider.bi.client.JdbcClient.Record

/**
  * Support read order from shopee
  *
  * @param client shopee client
  * @param job: ShopeeJob - object job config contains all information to sync
  * @param syncTimestampRange: RangeValue[Long] - time range to sync
  *
  * created 2023-04-05 10:24 AM
  * @author tvc12 - Thien Vi
  */
class OrderShopeeReader(
    client: ShopeeClient,
    job: ShopeeJob,
    syncTimestampRange: RangeValue[Long]
) extends Reader
    with Logging {
  private val ORDER_COLUMNS_FILE = "shopee/order.json"
  private val MAX_INTERVAL_IN_SEC = 15 * 24 * 60 * 60 // 15 days
  var hasNext: Boolean = true
  private var timeFromInSec: Long = syncTimestampRange.from
  var lastSyncedValue: Option[String] = None
  var columns: Seq[Column] = Seq.empty

  init()
  protected def init(): Unit = {
    hasNext = true
    timeFromInSec = syncTimestampRange.from
    lastSyncedValue = Option(String.valueOf(syncTimestampRange.from))
    columns = Reader.readColumns(ORDER_COLUMNS_FILE)
  }

  /**
    * Calculate time to in seconds with the following rules:
    * The maximum date range that may be specified with the time_from and time_to fields is 15 days.
    */
  private def getTimeToInSec(): Long = timeFromInSec + MAX_INTERVAL_IN_SEC

  override def next(columns: Seq[Column]): Seq[Record] = {
    try {
      if (hasNext) {
        val orders: Seq[Order] = client.listAllOrders(timeFromInSec, getTimeToInSec())
        val orderDetails: Seq[JsonNode] = client.getOrderDetails(orders.map(_.orderSn).toSet)
        val incrementalColumnIndex: Int = columns.indexWhere(_.name == job.incrementalColumn.getOrElse(""))
        val records = ShopeeReader.parseRecords(orderDetails, columns)
        lastSyncedValue = ShopeeReader.getLastSyncedValue(records, incrementalColumnIndex)
        records
      } else {
        throw CompletedReaderException("Reader has completed")
      }
    } finally {
      timeFromInSec = timeFromInSec + MAX_INTERVAL_IN_SEC + 1
      hasNext = timeFromInSec < syncTimestampRange.to
    }
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

  override def close(): Unit = {
    hasNext = false
  }

  override def isIncrementalMode(): Boolean = job.syncMode == SyncMode.IncrementalSync

  override def getLastSyncValue(): Option[String] = lastSyncedValue
}
