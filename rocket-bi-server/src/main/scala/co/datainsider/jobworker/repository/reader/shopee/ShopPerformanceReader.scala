package co.datainsider.jobworker.repository.reader.shopee

import co.datainsider.jobworker.client.shopee.ShopeeClient
import co.datainsider.jobworker.domain.SyncMode
import co.datainsider.jobworker.domain.job.ShopeeJob
import co.datainsider.jobworker.exception.CompletedReaderException
import co.datainsider.jobworker.repository.reader.Reader
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.node.ObjectNode
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import co.datainsider.bi.client.JdbcClient.Record

/**
  * Support read return order from shopee
  *
  * @param client shopee client
  * @param job: ShopeeJob - object job config contains all information to sync
  *
  * created 2023-04-05 10:24 AM
  * @author tvc12 - Thien Vi
  */
class ShopPerformanceReader(
    client: ShopeeClient,
    job: ShopeeJob
) extends Reader
    with Logging {
  private val COLUMNS_FILE = "shopee/shop_performance.json"
  var hasNext: Boolean = true
  var columns: Seq[Column] = Seq.empty
  val lastSyncedValue: Long = System.currentTimeMillis() / 1000

  init()
  protected def init(): Unit = {
    hasNext = true
    columns = Reader.readColumns(COLUMNS_FILE)
  }

  override def next(columns: Seq[Column]): Seq[Record] = {
    if (hasNext) {
      val jsonObject: JsonNode = client.getShopPerformance()
      addCreatedTime(jsonObject, lastSyncedValue)
      val records = ShopeeReader.parseRecords(Seq(jsonObject), columns)
      records
    } else {
      throw CompletedReaderException("Reader has completed")
    }
  }

  private def addCreatedTime(jsonObject: JsonNode, lastSyncedValue: Long): Unit = {
    jsonObject.asInstanceOf[ObjectNode].put("create_time", lastSyncedValue)
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

  override def getLastSyncValue(): Option[String] = Option(String.valueOf(lastSyncedValue))
}
