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

/**
  * created 2023-04-12 5:25 PM
  *
  * @author tvc12 - Thien Vi
  */
class OrderLazadaReader(client: LazadaClient, syncRangeValue: RangeValue[String], job: LazadaJob)
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
    columns = Reader.readColumns("lazada/order.json")
  }

  override def next(columns: Seq[Column]): Seq[Record] = {
    val orderResponse: OrderResponse = client.getOrders(syncRangeValue, offset = offset)
    val orderList: Seq[JsonNode] = orderResponse.orders
    val records: Seq[Record] = LazadaReader.parseRecords(orderList, columns)
    // try to get last sync value, if not exist, use last sync value
    lastSyncedValue = LazadaReader.getLastIncrementalValue(records, columns, job.incrementalColumn).orElse(lastSyncedValue)
    offset += orderList.size
    hasNext = orderList.nonEmpty && offset <= orderResponse.countTotal
    records
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
