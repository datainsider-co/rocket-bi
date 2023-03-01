package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{BoolColumn, DateTimeColumn, Int64Column, StringColumn}
import datainsider.client.service.SchemaClientService
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.repository.reader.shopify.ShopifyReader.ImplicitJsonNode
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.asScalaBufferConverter

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/location#top
class LocationReader(
    client: ShopifySdk,
    schemaService: SchemaClientService,
    limitSize: Int = 250
) extends ShopifyReader
    with Logging {
  override def getTableSchema(organizationId: Long, dbName: String, tblName: String): TableSchema = {
    return new TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = organizationId,
      displayName = StringUtils.getOriginTblName(tblName),
      columns = LocationReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    val locations: Seq[JsonNode] = fetchAllLocations(lastSyncedValue)

    if (locations.nonEmpty) {
      val records: Seq[Record] = locations.map(LocationReader.serialize)
      val locationIds: Seq[String] = locations.map(_.at("/id").asText())
      val latestId: String = ShopifyReader.getLatestId(locationIds)
      currentLatestId = ShopifyReader.max(latestId, currentLatestId)
      reportData(records, currentLatestId)
    }
  }


  @throws[ShopifyClientException]
  private def fetchAllLocations(lastId: Option[String]): Seq[JsonNode] = {
    // api unsupported sort & filter. use manual filter
    val lastedId = lastId.getOrElse("0")
    val newestLocations: Seq[JsonNode] = client.getLocations.asScala
      .filter(_.at("/id").isExists())
      .filter(location => ShopifyReader.isGreaterThan(location.at("/id").asText(), lastedId))
    return newestLocations;
  }
}

object LocationReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column("id", "id", Some("The ID of the location."), isNullable = true),
        "/id"
      ),
      ShopifyColumn(
        BoolColumn(
          "active",
          "active",
          Some(
            "Whether the location is active. If true, then the location can be used to sell products, stock inventory, and fulfill orders. Merchants can deactivate locations from the Shopify admin. Deactivated locations don't contribute to the shop's location limit."
          ),
          isNullable = true
        ),
        "/active"
      ),
      ShopifyColumn(
        StringColumn(
          "address1",
          "address1",
          Some("The location's street address."),
          isNullable = true
        ),
        "/address1"
      ),
      ShopifyColumn(
        StringColumn(
          "address2",
          "address2",
          Some("The optional second line of the location's street address."),
          isNullable = true
        ),
        "/address2"
      ),
      ShopifyColumn(
        StringColumn(
          "city",
          "city",
          Some("The city the location is in."),
          isNullable = true
        ),
        "/city"
      ),
      ShopifyColumn(
        StringColumn(
          "country",
          "country",
          Some("The country the location is in.."),
          isNullable = true
        ),
        "/country"
      ),
      ShopifyColumn(
        StringColumn(
          "country_code",
          "country_code",
          Some("The two-letter code (ISO 3166-1 alpha-2 format) corresponding to country the location is in."),
          isNullable = true
        ),
        "/country_code"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time (ISO 8601 format) when the location was created."),
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        BoolColumn(
          "legacy",
          "legacy",
          Some(
            "Whether this is a fulfillment service location. If true, then the location is a fulfillment service location. If false, then the location was created by the merchant and isn't tied to a fulfillment service."
          ),
          isNullable = true
        ),
        "/legacy"
      ),
      ShopifyColumn(
        StringColumn(
          "name",
          "name",
          Some("The name of the location."),
          isNullable = true
        ),
        "/name"
      ),
      ShopifyColumn(
        StringColumn(
          "phone",
          "phone",
          Some("The phone number of the location. This value can contain special characters, such as - or +."),
          isNullable = true
        ),
        "/phone"
      ),
      ShopifyColumn(
        StringColumn(
          "province",
          "province",
          Some("The province, state, or district of the location."),
          isNullable = true
        ),
        "/province"
      ),
      ShopifyColumn(
        StringColumn(
          "province_code",
          "province_code",
          Some("The province, state, or district code (ISO 3166-2 alpha-2 format) of the location."),
          isNullable = true
        ),
        "/province_code"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the location was last updated."),
          isNullable = true
        ),
        "/updated_at"
      ),
      ShopifyColumn(
        StringColumn(
          "zip",
          "zip",
          Some("The zip or postal code."),
          isNullable = true
        ),
        "/zip"
      ),
      ShopifyColumn(
        StringColumn(
          "localized_country_name",
          "localized_country_name",
          Some("The localized name of the location's country."),
          isNullable = true
        ),
        "/localized_country_name"
      ),
      ShopifyColumn(
        StringColumn(
          "localized_province_name",
          "localized_province_name",
          Some("The localized name of the location's region. Typically a province, state, or district."),
          isNullable = true
        ),
        "/localized_province_name"
      )
    )
}
