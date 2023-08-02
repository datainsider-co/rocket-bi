package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import co.datainsider.jobworker.util.StringUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.{ShopifyClientException, ShopifyErrorResponseException}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{DateTimeColumn, Int64Column}
import co.datainsider.bi.client.JdbcClient.Record
import ShopifyReader.ImplicitJsonNode
import org.apache.http.HttpStatus

import scala.jdk.CollectionConverters.asScalaBufferConverter

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/location#get-locations-location-id-inventory-levels
class InventoryLevelReader(
    client: ShopifySdk,
    limitSize: Int = 250
) extends ShopifyReader
    with Logging {

  override def getTableSchema(organizationId: Long, dbName: String, tblName: String): TableSchema = {
    return new TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = organizationId,
      displayName = StringUtils.getOriginTblName(tblName),
      columns = InventoryLevelReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchInventoryLevels(lastSyncedValue)(
      (locationId: String, inventoryLevels: Seq[JsonNode]) => {
        val records: Seq[Record] = inventoryLevels.map(InventoryLevelReader.serialize)
        currentLatestId = ShopifyReader.max(locationId, currentLatestId)
        reportData(records, currentLatestId)
      }
    )
  }


  @throws[ShopifyClientException]
  private def fetchInventoryLevels(lastId: Option[String])(handler: (String, Seq[JsonNode]) => Unit) = {
    // api unsupported sort & filter. use manual filter
    val lastedId = lastId.getOrElse("0")
    client.getLocations.asScala
      .filter(_.at("/id").isExists())
      .filter(location => ShopifyReader.isGreaterThan(location.at("/id").asText(), lastedId))
      .foreach(location => {
        val locationId: String = location.at("/id").asText()
        val inventoryLevels: Seq[JsonNode] = getInventoryLevels(locationId)
        handler(locationId, inventoryLevels)
      })
  }

  @throws[ShopifyClientException]
  private def getInventoryLevels(locationId: String): Seq[JsonNode] = {
    try {
      client.getInventoryLevels(locationId).asScala
    } catch {
      case ex: ShopifyErrorResponseException if (HttpStatus.SC_NOT_FOUND.equals(ex.getStatusCode)) =>
        warn(s"get inventory levels ${locationId} not found")
        Seq.empty
    }
  }
}

object InventoryLevelReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "location_id",
          "location_id",
          Some(
            "The ID of the location that the inventory level belongs to. To find the ID of the location, use the Location resource"
          ),
          isNullable = true
        ),
        "/location_id"
      ),
      ShopifyColumn(
        Int64Column(
          "inventory_item_id",
          "inventory_item_id",
          Some(
            "The ID of the inventory item associated with the inventory level. To find the ID of an inventory item, use the Inventory Item resource"
          ),
          isNullable = true
        ),
        "/inventory_item_id"
      ),
      ShopifyColumn(
        Int64Column(
          "available",
          "available",
          Some(
            "The available quantity of an inventory item at the inventory level's associated location. Returns null if the inventory item is not tracked."
          ),
          isNullable = true
        ),
        "/available"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the inventory level was last modified."),
          isNullable = true
        ),
        "/updated_at"
      )
    )
}
