package co.datainsider.jobworker.repository.reader.shopee

import co.datainsider.jobworker.client.shopee.{ProductResponse, ShopeeClient}
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
  * Support read product from shopee
  *
  * @param client shopee client
  * @param job: ShopeeJob - object job config contains all information to sync
  * @param syncTimestampRange: RangeValue[Long] - time range to sync
  *
  * created 2023-04-05 10:24 AM
  * @author tvc12 - Thien Vi
  */
class ProductShopeeReader(
    client: ShopeeClient,
    job: ShopeeJob,
    syncTimestampRange: RangeValue[Long]
) extends Reader
    with Logging {
  private val PRODUCT_COLUMNS_FILE = "shopee/product.json"
  var hasNext: Boolean = true
  var lastSyncedValue: Option[String] = None
  var columns: Seq[Column] = Seq.empty
  var offset: Int = 0

  init()
  protected def init(): Unit = {
    hasNext = true
    lastSyncedValue = Option(String.valueOf(syncTimestampRange.from))
    columns = Reader.readColumns(PRODUCT_COLUMNS_FILE)
  }

  override def next(columns: Seq[Column]): Seq[Record] = {
    if (hasNext) {
      val productResponse: ProductResponse = client.listProducts(syncTimestampRange, offset)
      val productDetails: Seq[JsonNode] = client.getProductDetails(productResponse.item.map(_.itemId).toSet)
      val incrementalColumnIndex: Int = columns.indexWhere(_.name == job.incrementalColumn.getOrElse(""))
      val records = ShopeeReader.parseRecords(productDetails, columns)
      lastSyncedValue = ShopeeReader.getLastSyncedValue(records, incrementalColumnIndex)
      hasNext = productResponse.hasNextPage
      offset = productResponse.nextOffset
      records
    } else {
      throw CompletedReaderException("Reader has completed")
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
