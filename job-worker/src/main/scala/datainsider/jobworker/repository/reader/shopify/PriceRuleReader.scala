package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.asScalaBufferConverter

//docs: https://shopify.dev/api/admin-rest/2022-04/resources/pricerule#post-price-rules
class PriceRuleReader(
    client: ShopifySdk,
    limitSize: Int = 250
) extends ShopifyReader
    with Logging {
  def getTableSchema(organizationId: Long, dbName: String, tblName: String): TableSchema = {
    return new TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = organizationId,
      displayName = StringUtils.getOriginTblName(tblName),
      columns = PriceRuleReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchPriceRules(lastSyncedValue)((priceRules: Seq[JsonNode]) => {
      if (priceRules.nonEmpty) {
        val records: Seq[Record] = priceRules.map(PriceRuleReader.serialize)
        val priceRuleIds: Seq[String] = priceRules.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(priceRuleIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })

  }


  @throws[ShopifyClientException]
  private def fetchPriceRules(lastId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val priceRules: ShopifyPage[JsonNode] = client.getPriceRules(request)
      handler(priceRules.asScala)

      if (priceRules.isEmpty || priceRules.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(priceRules.getNextPageInfo)
      }

    }
  }
}

object PriceRuleReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Some(
            "The ID for the price rule."
          ),
          isNullable = true
        ),
        "/id"
      ),
      ShopifyColumn(
        StringColumn(
          "allocation_method",
          "allocation_method",
          Some("The allocation method of the price rule."),
          isNullable = false
        ),
        "/allocation_method"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time (ISO 8601 format) when the price rule was created."),
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the price rule was updated."),
          isNullable = true
        ),
        "/updated_at"
      ),
      ShopifyColumn(
        StringColumn(
          "customer_selection",
          "customer_selection",
          Some("The customer selection for the price rule."),
          isNullable = true
        ),
        "/customer_selection"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "ends_at",
          "ends_at",
          Some("The date and time (ISO 8601 format) when the price rule ends. Must be after starts_at."),
          isNullable = true
        ),
        "/ends_at"
      ),
      ShopifyColumn(
        StringColumn(
          "entitled_collection_ids",
          "entitled_collection_ids",
          Some(
            "TA list of IDs of collections whose products will be eligible to the discount. It can be used only with target_type set to line_item and target_selection set to entitled. It can't be used in combination with entitled_product_ids or entitled_variant_ids.\n"
          ),
          isNullable = true
        ),
        "/entitled_collection_ids"
      ),
      ShopifyColumn(
        StringColumn(
          "entitled_country_ids",
          "entitled_country_ids",
          Some(
            "A list of IDs of shipping countries that will be entitled to the discount. It can be used only with target_type set to shipping_line and target_selection set to entitled."
          ),
          isNullable = true
        ),
        "/entitled_country_ids"
      ),
      ShopifyColumn(
        StringColumn(
          "entitled_product_ids",
          "entitled_product_ids",
          Some(
            "A list of IDs of products that will be entitled to the discount. It can be used only with target_type set to line_item and target_selection set to entitled."
          ),
          isNullable = true
        ),
        "/entitled_product_ids"
      ),
      ShopifyColumn(
        StringColumn(
          "entitled_variant_ids",
          "entitled_variant_ids",
          Some(
            "A list of IDs of product variants that will be entitled to the discount. It can be used only with target_type set to line_item and target_selection set to entitled."
          ),
          isNullable = true
        ),
        "/entitled_variant_ids"
      ),
      ShopifyColumn(
        BoolColumn(
          "once_per_customer",
          "once_per_customer",
          Some(
            "Whether the generated discount code will be valid only for a single use per customer. This is tracked using customer ID."
          ),
          isNullable = true
        ),
        "/once_per_customer"
      ),
      ShopifyColumn(
        StringColumn(
          "prerequisite_customer_ids",
          "prerequisite_customer_ids",
          Some(
            "A list of customer IDs."
          ),
          isNullable = true
        ),
        "/prerequisite_customer_ids"
      ),
      ShopifyColumn(
        StringColumn(
          "prerequisite_quantity_range",
          "prerequisite_quantity_range",
          Some(
            "The minimum number of items for the price rule to be applicable."
          ),
          isNullable = true
        ),
        "/prerequisite_quantity_range"
      ),
      ShopifyColumn(
        StringColumn(
          "customer_segment_prerequisite_ids",
          "customer_segment_prerequisite_ids",
          Some(
            "A list of customer segment IDs."
          ),
          isNullable = true
        ),
        "/customer_segment_prerequisite_ids"
      ),
      ShopifyColumn(
        StringColumn(
          "prerequisite_shipping_price_range",
          "prerequisite_shipping_price_range",
          Some(
            "The maximum shipping price for the price rule to be applicable."
          ),
          isNullable = true
        ),
        "/prerequisite_shipping_price_range"
      ),
      ShopifyColumn(
        StringColumn(
          "prerequisite_subtotal_range",
          "prerequisite_subtotal_range",
          Some(
            "The minimum subtotal for the price rule to be applicable."
          ),
          isNullable = true
        ),
        "/prerequisite_subtotal_range"
      ),
      ShopifyColumn(
        StringColumn(
          "prerequisite_to_entitlement_purchase",
          "prerequisite_to_entitlement_purchase",
          Some(
            "The prerequisite purchase for a Buy X Get Y discount."
          ),
          isNullable = true
        ),
        "/prerequisite_to_entitlement_purchase"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "starts_at",
          "starts_at",
          Some(
            "The date and time (ISO 8601 format) when the price rule starts."
          ),
          isNullable = true
        ),
        "/starts_at"
      ),
      ShopifyColumn(
        StringColumn(
          "target_selection",
          "target_selection",
          Some(
            "The target selection method of the price rule."
          ),
          isNullable = true
        ),
        "/target_selection"
      ),
      ShopifyColumn(
        StringColumn(
          "target_type",
          "target_type",
          Some(
            "The target type that the price rule applies to."
          ),
          isNullable = true
        ),
        "/target_type"
      ),
      ShopifyColumn(
        StringColumn(
          "title",
          "title",
          Some(
            "The title of the price rule. This is used by the Shopify admin search to retrieve discounts."
          ),
          isNullable = true
        ),
        "/title"
      ),
      ShopifyColumn(
        DoubleColumn(
          "usage_limit",
          "usage_limit",
          Some(
            "The maximum number of times the price rule can be used, per discount code."
          ),
          isNullable = true
        ),
        "/usage_limit"
      ),
      ShopifyColumn(
        StringColumn(
          "prerequisite_product_ids",
          "prerequisite_product_ids",
          Some(
            "List of product ids that will be a prerequisites for a Buy X Get Y type discounts"
          ),
          isNullable = true
        ),
        "/prerequisite_product_ids"
      ),
      ShopifyColumn(
        StringColumn(
          "prerequisite_variant_ids",
          "prerequisite_variant_ids",
          Some(
            "List of variant ids that will be a prerequisites for a Buy X Get Y type discount."
          ),
          isNullable = true
        ),
        "/prerequisite_variant_ids"
      ),
      ShopifyColumn(
        StringColumn(
          "prerequisite_collection_ids",
          "prerequisite_collection_ids",
          Some(
            "List of collection ids that will be a prerequisites for a Buy X Get Y discount."
          ),
          isNullable = true
        ),
        "/prerequisite_collection_ids"
      ),
      ShopifyColumn(
        DoubleColumn(
          "value",
          "value",
          Some(
            "The value of the price rule. If if the value of target_type is shipping_line, then only -100 is accepted. The value must be negative."
          ),
          isNullable = true
        ),
        "/value"
      ),
      ShopifyColumn(
        StringColumn(
          "value_type",
          "value_type",
          Some(
            "The value type of the price rule."
          ),
          isNullable = true
        ),
        "/value_type"
      ),
      ShopifyColumn(
        StringColumn(
          "prerequisite_to_entitlement_quantity_ratio",
          "prerequisite_to_entitlement_quantity_ratio",
          Some(
            "Buy/Get ratio for a Buy X Get Y discount. prerequisite_quantity defines the necessary 'buy' quantity and entitled_quantity the offered 'get' quantity."
          ),
          isNullable = true
        ),
        "/prerequisite_to_entitlement_quantity_ratio"
      ),
      ShopifyColumn(
        DoubleColumn(
          "allocation_limit",
          "allocation_limit",
          Some(
            "The number of times the discount can be allocated on the cart - if eligible."
          ),
          isNullable = true
        ),
        "/allocation_limit"
      )
    )
}
