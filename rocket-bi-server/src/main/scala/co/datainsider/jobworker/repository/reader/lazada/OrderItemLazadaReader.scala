package co.datainsider.jobworker.repository.reader.lazada

import co.datainsider.jobworker.client.lazada.{LazadaClient, OrderResponse}
import co.datainsider.jobworker.domain.{RangeValue, SyncMode}
import co.datainsider.jobworker.domain.job.LazadaJob
import co.datainsider.jobworker.repository.reader.Reader
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import co.datainsider.bi.client.JdbcClient.Record

import scala.util.Try

/**
  * created 2023-04-12 5:25 PM
  *
  * @author tvc12 - Thien Vi
  */
class OrderItemLazadaReader(client: LazadaClient, syncRangeValue: RangeValue[String], job: LazadaJob)
    extends Reader
    with Logging {
  var hasNext: Boolean = true
  var offset: Long = 0
  var columns: Seq[Column] = Seq.empty
  var lastSyncedValue: Option[String] = Some(syncRangeValue.from)
  init()
  protected def init(): Unit = {
    hasNext = true
    offset = 0
    columns = Reader.readColumns("lazada/order_item.json")
  }

  override def next(columns: Seq[Column]): Seq[Record] = {
    val orderResponse: OrderResponse = client.getOrders(syncRangeValue, offset = offset)
    val orderIds: Set[String] = getOrderIds(orderResponse.orders)
    val orderItems: Seq[JsonNode] = client.getOrderItems(orderIds).flatMap(_.orderItems)
    val records: Seq[Record] = LazadaReader.parseRecords(orderItems, columns)
    // try to get last sync value, if not exist, use last sync value
    lastSyncedValue = getLastSyncedValue(orderResponse.orders).orElse(lastSyncedValue)
    offset += orderResponse.orders.size
    hasNext = orderResponse.orders.nonEmpty && offset <= orderResponse.countTotal
    records
  }

  private def getLastSyncedValue(orders: Seq[JsonNode]): Option[String] = {
    if (orders.nonEmpty && isIncrementalMode() && job.incrementalColumn.isDefined) {
      val lastOrder: JsonNode = orders.last
      val jsonNode: JsonNode = lastOrder.get(job.incrementalColumn.get)
      Try(LazadaReader.toDateTime(jsonNode).toString).toOption
    } else {
      None
    }
  }

  private def getOrderIds(orders: Seq[JsonNode]): Set[String] = {
    orders.map(order => order.get("order_id").asText()).toSet
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
    // do nothing
  }

  override def isIncrementalMode(): Boolean = job.syncMode == SyncMode.IncrementalSync

  override def getLastSyncValue(): Option[String] = lastSyncedValue
}
