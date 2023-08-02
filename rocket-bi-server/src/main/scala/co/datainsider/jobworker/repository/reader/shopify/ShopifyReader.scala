package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.domain.job.ShopifyTable
import co.datainsider.jobworker.domain.source.ShopifySource
import co.datainsider.jobworker.util.ShopifyUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import co.datainsider.schema.domain.TableSchema
import datainsider.client.exception.UnsupportedError
import co.datainsider.bi.client.JdbcClient.Record
import ShopifyTable.ShopifyTable
import co.datainsider.jobworker.util.StringUtils.RichOptionConvert

import java.util.concurrent.TimeUnit

/**
  * Class handle read data from shopify.
  */
trait ShopifyReader {

  /**
    * @return schema hien tai cua shopify api
    */
  def getTableSchema(organizationId: Long, dbName: String, tblName: String): TableSchema

  /**
    * Read all records from shopify, cho phep lay data tu last sync value
    * @reportData(records: Seq[Record], lastedId: String): call khi lay data tu server. records la data tra ve da duoc serializer, latestId la lasted id hien tai khi call api
    * @throws[ShopifyClientException] if has exception when call shopify api
    */
  @throws[ShopifyClientException]
  def bulkRead(lastSyncedValue: Option[String] = None)(reportData: (Seq[Record], String) => Unit): Unit
}

object ShopifyReader {

  /**
    * @return latest id from list ids
    * @throws UnsupportedOperationException when ids is empty
    */
  @throws[UnsupportedOperationException]
  def getLatestId(ids: Seq[String]): String = {
    val latestId: Long = ids
      .filter(id => id != null)
      .map(_.toLongOption().getOrElse(0L))
      .max
    String.valueOf(latestId)
  }

  /**
    *
    * @param idA value of id a
    * @param idB value of id b
    * @return max of id a vs b. neu 2 id khong phai la so long se tra ve gia tri idB
    */
  def max(idA: String, idB: String): String = {
    if (idA.toLongOption().getOrElse(0L) > idB.toLongOption.getOrElse(0L)) {
      return idA
    } else {
      return idB
    }
  }

  def isGreaterThan(idA: String, idB: String): Boolean = {
    idA.toLongOption().getOrElse(0L) > idB.toLongOption.getOrElse(0L)
  }

  implicit class ImplicitJsonNode(val value: JsonNode) extends AnyVal {

    /**
      * tra ve gia tri co ton tai hay khong, neu node.isNull || node.isMissingNode => false, otherwise return true
      */
    def isExists(): Boolean = {
      !(value.isNull || value.isMissingNode)
    }

    /**
      * True when node is null or node is MissingNode, otherwise false
      * @return
      */
    def isNotExists(): Boolean = {
      value.isNull || value.isMissingNode
    }
  }

  @throws[UnsupportedError]
  def apply(
      source: ShopifySource,
      table: ShopifyTable,
      retryTimeoutMs: Int = 30000,
      minRetryTimeDelayMs: Int = 500,
      maxRetryTimeDelayMs: Int = 1000
  ): ShopifyReader = {
    val client: ShopifySdk = getClient(source, retryTimeoutMs, minRetryTimeDelayMs, maxRetryTimeDelayMs)
    table match {
      case ShopifyTable.Report            => new ReportReader(client)
      case ShopifyTable.Customer          => new CustomerReader(client)
      case ShopifyTable.Order             => new OrderReader(client)
      case ShopifyTable.OrderTransaction  => new TransactionReader(client)
      case ShopifyTable.OrderRisk         => new OrderRiskReader(client)
      case ShopifyTable.Refund            => new RefundReader(client)
      case ShopifyTable.DraftOrder        => new DraftOrderReader(client)
      case ShopifyTable.AbandonedCheckout => new AbandonedCheckoutReader(client)
      case ShopifyTable.Fulfillment       => new FulfillmentReader(client)
      case ShopifyTable.FulfillmentOrder  => new FulfillmentOrderReader(client)
      case ShopifyTable.Product           => new ProductReader(client)
      case ShopifyTable.ProductImage      => new ProductImageReader(client)
      case ShopifyTable.ProductVariant    => new ProductVariantReader(client)
      case ShopifyTable.Collection        => new CollectionReader(client)
      case ShopifyTable.SmartCollection   => new SmartCollectionReader(client)
      case ShopifyTable.CustomCollection  => new CustomCollectionReader(client)
      case ShopifyTable.PriceRule         => new PriceRuleReader(client)
      case ShopifyTable.DiscountCode      => new DiscountCodeReader(client)
      case ShopifyTable.DiscountCode      => new DiscountCodeReader(client)
      case ShopifyTable.Event             => new EventReader(client)
      case ShopifyTable.Location          => new ProductReader(client)
      case ShopifyTable.InventoryLevel    => new InventoryLevelReader(client)
      case ShopifyTable.InventoryItem     => new InventoryItemReader(client)
      case ShopifyTable.MarketingEvent    => new MarketingEventReader(client)
      case ShopifyTable.MetaField         => new MetaFieldReader(client)
      case ShopifyTable.Blog              => new BlogReader(client)
      case ShopifyTable.Article           => new ArticleReader(client)
      case ShopifyTable.Comment           => new CommentReader(client)
      case ShopifyTable.Page              => new PageReader(client)
      case ShopifyTable.Theme             => new ThemeReader(client)
      case ShopifyTable.Asset             => new AssetReader(client)
      case ShopifyTable.Redirect          => new RedirectReader(client)
      case ShopifyTable.ScripTag          => new ScriptTagReader(client)
      case ShopifyTable.TenderTransaction => new TenderTransactionReader(client)
      case ShopifyTable.GiftCard          => new GiftCardReader(client)
      case ShopifyTable.CustomerAddress   => new CustomerAddressReader(client)
      case _                              => throw UnsupportedError(s"unsupported sync table ${table.toString}")
    }
  }

  def getClient(
      source: ShopifySource,
      retryTimeoutMs: Int,
      minRetryTimeDelayMs: Int,
      maxRetryTimeDelayMs: Int
  ): ShopifySdk = {
    val client = ShopifySdk
      .newBuilder()
      .withApiUrl(source.getAdminUrl)
      .withAccessToken(source.accessToken)
      .withApiVersion(source.apiVersion)
      .withMaximumRequestRetryRandomDelay(retryTimeoutMs, TimeUnit.MILLISECONDS)
      .withMinimumRequestRetryRandomDelay(minRetryTimeDelayMs, TimeUnit.MILLISECONDS)
      .withMaximumRequestRetryTimeout(maxRetryTimeDelayMs, TimeUnit.MILLISECONDS)
      .build()
    return client
  }

  def getClient(
      shopifyUrl: String,
      authorizationCode: String,
      clientId: String,
      clientSecret: String,
      retryTimeoutMs: Int = 15000,
      minRetryTimeDelayMs: Int = 500,
      maxRetryTimeDelayMs: Int = 1000
  ): ShopifySdk = {
    val adminUrl: String = ShopifyUtils.getAdminUrl(shopifyUrl)
    val client: ShopifySdk = ShopifySdk
      .newBuilder()
      .withApiUrl(adminUrl)
      .withClientId(clientId)
      .withClientSecret(clientSecret)
      .withAuthorizationToken(authorizationCode)
      .withMaximumRequestRetryRandomDelay(retryTimeoutMs, TimeUnit.MILLISECONDS)
      .withMinimumRequestRetryRandomDelay(minRetryTimeDelayMs, TimeUnit.MILLISECONDS)
      .withMaximumRequestRetryTimeout(maxRetryTimeDelayMs, TimeUnit.MILLISECONDS)
      .build()
    return client
  }
}
