package co.datainsider.jobworker.service.handler

import co.datainsider.jobworker.domain.Job
import co.datainsider.jobworker.domain.job.ShopifyTable
import co.datainsider.jobworker.domain.source.ShopifySource
import co.datainsider.jobworker.repository.reader.shopify.ShopifyReader
import com.shopify.ShopifySdk
import com.shopify.model.Shop
import com.twitter.util.Future
import com.twitter.util.logging.Logging

import scala.collection.mutable

class ShopifyMetadataHandler(dataSource: ShopifySource,
                             retryTimeoutMs: Int = 15000,
                             minRetryTimeDelayMs: Int = 500,
                             maxRetryTimeDelayMs: Int = 1000)
extends SourceMetadataHandler with Logging{
  private val SHOPIFY_PLUS = "shopify_plus"

  def testConnection(): Future[Boolean] = {
    try {
      val client: ShopifySdk = ShopifyReader.getClient(dataSource, retryTimeoutMs, minRetryTimeDelayMs, maxRetryTimeDelayMs)
      val isConnected: Boolean = client.getShop != null
      Future.value(isConnected)
    }catch {
      case ex: Throwable => {
        error("testConnection::failed", ex)
        Future.False
      }
    }
  }

  override def listDatabases(): Future[Seq[String]] = Future.value(Seq("shopify"))

  private def getShopPlanName(): Option[String] = {
    try {
      val client: ShopifySdk = ShopifyReader.getClient(dataSource, retryTimeoutMs, minRetryTimeDelayMs, maxRetryTimeDelayMs)
      val shop: Shop = client.getShop
      Option(shop.getPlanName)
    }catch {
      case ex: Throwable => None
    }
  }

  // https://community.shopify.com/c/shopify-apis-and-sdks/enumeration-of-plan-name-from-get-admin-shop-json/td-p/273614
  override def listTables(databaseName: String): Future[Seq[String]] = Future {
    val planName: Option[String] = getShopPlanName()
    if (SHOPIFY_PLUS.equals(planName.getOrElse(""))) {
      val tables: Seq[String] = ShopifyTable.values.map(_.toString).toSeq
      tables
    } else {
      val tables: mutable.Set[ShopifyTable.Value] = mutable.Set(ShopifyTable.values.toArray: _*)
      tables.remove(ShopifyTable.GiftCard)
      tables.remove(ShopifyTable.User)
      tables.map(_.toString).toSeq
    }
  }

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = Future.Nil

  override def testJob(job: Job): Future[Boolean] = Future.True
}
