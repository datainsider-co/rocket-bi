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
import datainsider.jobworker.repository.reader.shopify.ShopifyReader.ImplicitJsonNode
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.{asScalaBufferConverter, asScalaIteratorConverter, seqAsJavaListConverter}

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/location#get-locations-location-id-inventory-levels
class InventoryItemReader(
    client: ShopifySdk,
    limitSize: Int = 250,
    inventorySize: Int = 100
) extends ShopifyReader
    with Logging {

  override def getTableSchema(organizationId: Long, dbName: String, tblName: String): TableSchema = {
    return new TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = organizationId,
      displayName = StringUtils.getOriginTblName(tblName),
      columns = InventoryItemReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchInventoryItems(lastSyncedValue)((productId: String, inventoryItems: Seq[JsonNode]) => {
      val records: Seq[Record] = inventoryItems.map(InventoryItemReader.serialize)
      currentLatestId = ShopifyReader.max(productId, currentLatestId)
      reportData(records, currentLatestId)
    })
  }

  @throws[ShopifyClientException]
  private def getInventoryItems(inventoryItemIds: Seq[String]): Seq[JsonNode] = {
    val uniqueItemIds: Seq[String] = inventoryItemIds.toSet.toSeq
    // API limit get 100 items per 1 request
    val shopifyItems: Seq[JsonNode] = uniqueItemIds
      .grouped(inventorySize)
      .flatMap((ids: Seq[String]) => {
        if (ids.nonEmpty) {
          client.getInventoryItems(ids.asJava).asScala
        } else {
          Seq.empty
        }
      })
      .toSeq
    return shopifyItems
  }

  @throws[ShopifyClientException]
  private def fetchInventoryItems(lastId: Option[String])(handler: (String, Seq[JsonNode]) => Unit): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest
      .newBuilder()
      .withSinceId(lastId.orNull)
      .withFields("id,variants")
      .withLimit(limitSize)
      .build()
    while (true) {
      val products: ShopifyPage[JsonNode] = client.getProducts(request)
      products.asScala
        .filter(product => product.at("/id").isExists())
        .filter(product => product.at("/variants").isExists())
        .foreach(product => {
          val inventoryItemIds: Seq[String] = product
            .at("/variants")
            .iterator()
            .asScala
            .filter(_.at("/inventory_item_id").isExists())
            .map(_.at("/inventory_item_id").asText())
            .toSeq
          val inventoryItems: Seq[JsonNode] = getInventoryItems(inventoryItemIds)
          handler(product.at("/id").asText(), inventoryItems)
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

object InventoryItemReader {
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
            "The ID of the inventory item."
          ),
          isNullable = true
        ),
        "/id"
      ),
      ShopifyColumn(
        DoubleColumn(
          "cost",
          "cost",
          Some(
            "The unit cost of the inventory item. The shop's default currency is used."
          ),
          isNullable = true
        ),
        "/cost"
      ),
      ShopifyColumn(
        StringColumn(
          "country_code_of_origin",
          "country_code_of_origin",
          Some(
            "The country code (ISO 3166-1 alpha-2) of where the item came from."
          ),
          isNullable = true
        ),
        "/country_code_of_origin"
      ),
      ShopifyColumn(
        StringColumn(
          "country_harmonized_system_codes",
          "country_harmonized_system_codes",
          Some(
            "An array of country-specific Harmonized System (HS) codes for the item. Used to determine duties when shipping the inventory item to certain countries."
          ),
          isNullable = true
        ),
        "/country_harmonized_system_codes"
      ),
      ShopifyColumn(
        StringColumn(
          "harmonized_system_code",
          "harmonized_system_code",
          Some(
            "The general Harmonized System (HS) code for the inventory item. Used if a country-specific HS code (`countryHarmonizedSystemCode`) is not available."
          ),
          isNullable = true
        ),
        "/harmonized_system_code"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time (ISO 8601 format) when the inventory item was created."),
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          "province_code_of_origin",
          "province_code_of_origin",
          Some(
            "The province code (ISO 3166-2 alpha-2) of where the item came from. The province code is only used if the shipping provider for the inventory item is Canada Post."
          ),
          isNullable = true
        ),
        "/province_code_of_origin"
      ),
      ShopifyColumn(
        StringColumn(
          "sku",
          "sku",
          Some("The unique SKU (stock keeping unit) of the inventory item."),
          isNullable = true
        ),
        "/sku"
      ),
      ShopifyColumn(
        BoolColumn(
          "tracked",
          "tracked",
          Some(
            "Whether inventory levels are tracked for the item. If true, then the inventory quantity changes are tracked by Shopify."
          ),
          isNullable = true
        ),
        "/tracked"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the inventory item was last modified."),
          isNullable = true
        ),
        "/updated_at"
      ),
      ShopifyColumn(
        BoolColumn(
          "requires_shipping",
          "requires_shipping",
          Some(
            "Whether a customer needs to provide a shipping address when placing an order containing the inventory item."
          ),
          isNullable = true
        ),
        "/requires_shipping"
      )
    )
}
