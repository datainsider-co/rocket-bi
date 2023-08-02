package co.datainsider.jobworker.repository.reader.shopee

import co.datainsider.jobworker.client.HttpClientImpl
import co.datainsider.jobworker.client.shopee.ShopeeClientImpl
import co.datainsider.jobworker.domain.job.{ShopeeJob, ShopeeSupportedTable}
import co.datainsider.jobworker.domain.source.ShopeeSource
import co.datainsider.jobworker.domain.{RangeValue, SyncMode}
import co.datainsider.jobworker.exception.CreateReaderException
import co.datainsider.jobworker.repository.reader.Reader
import co.datainsider.jobworker.repository.reader.factory.ReaderFactory
import com.twitter.util.logging.Logging

class ShopeeReaderFactory(apiUrl: String, partnerId: String, partnerKey: String)
    extends ReaderFactory[ShopeeSource, ShopeeJob]
    with Logging {

  override def create(source: ShopeeSource, job: ShopeeJob): Reader = {
    val client: ShopeeClientImpl = createShopeeClient(source, job.shopId)
    val syncTimestampRange: RangeValue[Long] = getTimestampRange(job)
    job.tableName match {
      case ShopeeSupportedTable.Order           => new OrderShopeeReader(client, job, syncTimestampRange)
      case ShopeeSupportedTable.Product         => new ProductShopeeReader(client, job, syncTimestampRange)
      case ShopeeSupportedTable.Category        => new CategoryShopeeReader(client, job)
      case ShopeeSupportedTable.ShopPerformance => new ShopPerformanceReader(client, job)
      case _                                    => throw CreateReaderException(s"Reader data from table ${job.tableName} is not supported")
    }
  }

  private def createShopeeClient(source: ShopeeSource, shopId: String): ShopeeClientImpl = {
    new ShopeeClientImpl(
      client = new HttpClientImpl(apiUrl),
      partnerId = partnerId,
      partnerKey = partnerKey,
      accessToken = Some(source.accessToken),
      shopId = Some(shopId)
    )
  }

  private def getTimestampRange(job: ShopeeJob): RangeValue[Long] = {
    job.syncMode match {
      case SyncMode.IncrementalSync => {
        val startTimestamp: Long = getLastSyncedValue(job)
        val endTimestamp: Long = System.currentTimeMillis() / 1000
        RangeValue(startTimestamp, endTimestamp)
      }
      case SyncMode.FullSync => job.timeRange
      case _                 => throw CreateReaderException(s"Sync mode ${job.syncMode} is not supported")
    }
  }

  private def getLastSyncedValue(job: ShopeeJob): Long = {
    try {
      val lastSyncedValue: Long = job.lastSyncedValue match {
        case Some(value) => value.toLong
        case _           => job.timeRange.from
      }
      lastSyncedValue
    } catch {
      case ex: Throwable => {
        logger.error(s"Can't get last synced value, cause: ${ex.getMessage}", ex)
        job.timeRange.from
      }
    }
  }

}
