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
class PayoutStatusLazadaReader(client: LazadaClient, syncRangeValue: RangeValue[String], job: LazadaJob)
    extends Reader
    with Logging {
  var hasNext: Boolean = true
  var columns: Seq[Column] = Seq.empty
  var lastSyncedValue: Option[String] = Some(syncRangeValue.to)
  init()
  protected def init(): Unit = {
    hasNext = true
    columns = Reader.readColumns("lazada/payout_status.json")
  }

  override def next(columns: Seq[Column]): Seq[Record] = {
    val payoutStatusList: Seq[JsonNode] = client.getPayoutStatusList(syncRangeValue.from)
    val records: Seq[Record] = LazadaReader.parseRecords(payoutStatusList, columns)
    hasNext = false
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
