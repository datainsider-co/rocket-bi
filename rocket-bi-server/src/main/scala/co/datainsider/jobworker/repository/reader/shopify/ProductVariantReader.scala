package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import co.datainsider.jobworker.util.StringUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import co.datainsider.bi.client.JdbcClient.Record
import ShopifyReader.ImplicitJsonNode

import scala.jdk.CollectionConverters.{asScalaBufferConverter, asScalaIteratorConverter}

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/product-variant#top
class ProductVariantReader(
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
      columns = ProductVariantReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchProductVariants(lastSyncedValue)((productId: String, variants: Seq[JsonNode]) => {
      val records = variants.map(ProductVariantReader.serialize)
      currentLatestId = ShopifyReader.max(productId, currentLatestId)
      reportData(records, currentLatestId)
    })

  }


  @throws[ShopifyClientException]
  private def fetchProductVariants(lastId: Option[String])(
      handler: (String, Seq[JsonNode]) => Unit
  ): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val products: ShopifyPage[JsonNode] = client.getProducts(request)
      products.asScala
        .filter(_.at("/id").isExists())
        .filter(_.at("/variants").isExists())
        .foreach(product => {
          val productId: String = product.at("/id").asText()
          val variants: Seq[JsonNode] = product.at("/variants").iterator().asScala.toSeq
          handler(productId, variants)
        })

      if (products.isEmpty || products.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(products.getNextPageInfo)
      }

    }
  }
}

object ProductVariantReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Some("The unique numeric identifier for the product variant."),
          isNullable = false
        ),
        "/id"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time (ISO 8601 format) when the product variant was created."),
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          "barcode",
          "barcode",
          Some("The barcode, UPC, or ISBN number for the product."),
          isNullable = true
        ),
        "/barcode"
      ),
      ShopifyColumn(
        DoubleColumn(
          "compare_at_price",
          "compare_at_price",
          Some("The original price of the item before an adjustment or a sale."),
          isNullable = true
        ),
        "/compare_at_price"
      ),
      ShopifyColumn(
        StringColumn(
          "fulfillment_service",
          "fulfillment_service",
          Some(
            "The fulfillment service associated with the product variant. Valid values: manual or the handle of a fulfillment service."
          ),
          isNullable = true
        ),
        "/fulfillment_service"
      ),
      ShopifyColumn(
        DoubleColumn(
          "grams",
          "grams",
          Some("The weight of the product variant in grams."),
          isNullable = true
        ),
        "/grams"
      ),
      ShopifyColumn(
        Int64Column(
          "image_id",
          "image_id",
          Some(
            "The unique numeric identifier for a product's image. The image must be associated to the same product as the variant."
          ),
          isNullable = true
        ),
        "/image_id"
      ),
      ShopifyColumn(
        Int64Column(
          "inventory_item_id",
          "inventory_item_id",
          Some(
            "The unique identifier for the inventory item, which is used in the Inventory API to query for inventory information."
          ),
          isNullable = true
        ),
        "/inventory_item_id"
      ),
      ShopifyColumn(
        StringColumn(
          "inventory_management",
          "inventory_management",
          Some("The fulfillment service that tracks the number of items in stock for the product variant."),
          isNullable = true
        ),
        "/inventory_management"
      ),
      ShopifyColumn(
        StringColumn(
          "inventory_policy",
          "inventory_policy",
          Some("Whether customers are allowed to place an order for the product variant when it's out of stock."),
          isNullable = true
        ),
        "/inventory_policy"
      ),
      ShopifyColumn(
        Int64Column(
          "inventory_quantity",
          "inventory_quantity",
          Some(
            "An aggregate of inventory across all locations. To adjust inventory at a specific location, use the InventoryLevel resource."
          ),
          isNullable = true
        ),
        "/inventory_quantity"
      ),
      ShopifyColumn(
        Int64Column(
          "old_inventory_quantity",
          "old_inventory_quantity",
          Some("This property is deprecated. Use the InventoryLevel resource instead."),
          isNullable = true
        ),
        "/old_inventory_quantity"
      ),
      ShopifyColumn(
        Int64Column(
          "inventory_quantity_adjustment",
          "inventory_quantity_adjustment",
          Some("This property is deprecated. Use the InventoryLevel resource instead."),
          isNullable = true
        ),
        "/inventory_quantity_adjustment"
      ),
      ShopifyColumn(
        StringColumn(
          "option1",
          "option1",
          Some("The custom properties that a shop owner uses to define product variants."),
          isNullable = true
        ),
        "/option1"
      ),
      ShopifyColumn(
        StringColumn(
          "option2",
          "option2",
          Some("The custom properties that a shop owner uses to define product variants."),
          isNullable = true
        ),
        "/option2"
      ),
      ShopifyColumn(
        StringColumn(
          "option3",
          "option3",
          Some("The custom properties that a shop owner uses to define product variants."),
          isNullable = true
        ),
        "/option3"
      ),
      ShopifyColumn(
        StringColumn(
          "presentment_prices",
          "presentment_prices",
          Some(
            "A list of the variant's presentment prices and compare-at prices in each of the shop's enabled presentment currencies."
          ),
          isNullable = true
        ),
        "/presentment_prices"
      ),
      ShopifyColumn(
        Int64Column(
          "position",
          "position",
          Some(
            "The order of the product variant in the list of product variants. The first position in the list is 1. The position of variants is indicated by the order in which they are listed."
          ),
          isNullable = true
        ),
        "/position"
      ),
      ShopifyColumn(
        DoubleColumn(
          "price",
          "price",
          Some("The price of the product variant."),
          isNullable = true
        ),
        "/price"
      ),
      ShopifyColumn(
        Int64Column(
          "product_id",
          "product_id",
          Some("The unique numeric identifier for the product."),
          isNullable = true
        ),
        "/product_id"
      ),
      ShopifyColumn(
        BoolColumn(
          "requires_shipping",
          "requires_shipping",
          Some(
            "This property is deprecated. Use the `requires_shipping` property on the InventoryItem resource instead."
          ),
          isNullable = true
        ),
        "/requires_shipping"
      ),
      ShopifyColumn(
        StringColumn(
          "sku",
          "sku",
          Some(
            "A unique identifier for the product variant in the shop. Required in order to connect to a FulfillmentService."
          ),
          isNullable = true
        ),
        "/sku"
      ),
      ShopifyColumn(
        BoolColumn(
          "taxable",
          "taxable",
          Some(
            "This parameter applies only to the stores that have the Avalara AvaTax app installed. Specifies the Avalara tax code for the product variant."
          ),
          isNullable = true
        ),
        "/taxable"
      ),
      ShopifyColumn(
        StringColumn(
          "title",
          "title",
          Some(
            "The title of the product variant. The title field is a concatenation of the option1, option2, and option3 fields. You can only update title indirectly using the option fields."
          ),
          isNullable = true
        ),
        "/title"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time when the product variant was last modified. Gets returned in ISO 8601 format."),
          isNullable = true
        ),
        "/updated_at"
      ),
      ShopifyColumn(
        DoubleColumn(
          "weight",
          "weight",
          Some("The weight of the product variant in the unit system specified with weight_unit."),
          isNullable = true
        ),
        "/weight"
      ),
      ShopifyColumn(
        StringColumn(
          "weight_unit",
          "weight_unit",
          Some(
            "The unit of measurement that applies to the product variant's weight. If you don't specify a value for weight_unit, then the shop's default unit of measurement is applied. Valid values: g, kg, oz, and lb."
          ),
          isNullable = true
        ),
        "/weight_unit"
      )
    )
}
