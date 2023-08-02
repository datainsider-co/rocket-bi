package co.datainsider.jobworker.repository.reader.shopee

import co.datainsider.jobworker.client.shopee.ShopeeClient
import co.datainsider.jobworker.domain.job.ShopeeJob
import co.datainsider.jobworker.exception.CompletedReaderException
import co.datainsider.jobworker.repository.reader.Reader
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column
import co.datainsider.bi.client.JdbcClient.Record

/**
  * Support read category from shopee
  *
  * @param client shopee client
  * @param job: ShopeeJob - object job config contains all information to sync
  *
  * created 2023-04-05 10:24 AM
  * @author tvc12 - Thien Vi
  */
class CategoryShopeeReader(
    client: ShopeeClient,
    job: ShopeeJob
) extends Reader
    with Logging {
  private val COLUMNS_FILE = "shopee/category.json"
  var hasNext: Boolean = true
  var columns: Seq[Column] = Seq.empty

  init()
  protected def init(): Unit = {
    hasNext = true
    columns = Reader.readColumns(COLUMNS_FILE)
  }

  override def next(columns: Seq[Column]): Seq[Record] = {
    if (hasNext) {
      val categoryList: Seq[JsonNode] = client.listAllCategories()
      val records = ShopeeReader.parseRecords(categoryList, columns)
      hasNext = false
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

  override def isIncrementalMode(): Boolean = false

  override def getLastSyncValue(): Option[String] = None
}
