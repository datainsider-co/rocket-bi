package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import co.datainsider.jobworker.util.StringUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{DateTimeColumn, Int64Column, StringColumn}
import co.datainsider.bi.client.JdbcClient.Record

import scala.jdk.CollectionConverters.asScalaBufferConverter

//docs: https://shopify.dev/api/admin-rest/2022-04/resources/product#top
class ProductReader(
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
      columns = ProductReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchProducts(lastSyncedValue)((products: Seq[JsonNode]) => {
      if (products.nonEmpty) {
        val records: Seq[Record] = products.map(ProductReader.serialize)
        val productIds: Seq[String] = products.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(productIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })
  }


  @throws[ShopifyClientException]
  private def fetchProducts(lastId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val products: ShopifyPage[JsonNode] = client.getProducts(request)
      handler(products.asScala)

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

object ProductReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Some("An unsigned 64-bit integer that's used as a unique identifier for the product."),
          isNullable = false
        ),
        "/id"
      ),
      ShopifyColumn(
        StringColumn(
          "body_html",
          "body_html",
          Some("A description of the product. Supports HTML formatting."),
          isNullable = true
        ),
        "/body_html"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time (ISO 8601 format) when the product was created."),
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          "handle",
          "handle",
          Some(
            "A unique human-friendly string for the product. Automatically generated from the product's title. Used by the Liquid templating language to refer to objects."
          ),
          isNullable = true
        ),
        "/handle"
      ),
      ShopifyColumn(
        StringColumn(
          "images",
          "images",
          Some("A list of product image objects, each one representing an image associated with the product."),
          isNullable = true
        ),
        "/images"
      ),
      ShopifyColumn(
        StringColumn(
          "options",
          "options",
          Some("The custom product properties."),
          isNullable = true
        ),
        "/options"
      ),
      ShopifyColumn(
        StringColumn(
          "product_type",
          "product_type",
          Some("A categorization for the product used for filtering and searching products."),
          isNullable = true
        ),
        "/product_type"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "published_at",
          "published_at",
          Some(
            "The date and time (ISO 8601 format) when the product was published. Can be set to null to unpublish the product from the Online Store channel."
          ),
          isNullable = true
        ),
        "/published_at"
      ),
      ShopifyColumn(
        StringColumn(
          "published_scope",
          "published_scope",
          Some("Whether the product is published to the Point of Sale channel."),
          isNullable = true
        ),
        "/published_scope"
      ),
      ShopifyColumn(
        StringColumn(
          "status",
          "status",
          Some("The status of the product."),
          isNullable = true
        ),
        "/status"
      ),
      ShopifyColumn(
        StringColumn(
          "tags",
          "tags",
          Some(
            "A string of comma-separated tags that are used for filtering and search. A product can have up to 250 tags. Each tag can have up to 255 characters."
          ),
          isNullable = true
        ),
        "/tags"
      ),
      ShopifyColumn(
        StringColumn(
          "template_suffix",
          "template_suffix",
          Some("The suffix of the Liquid template used for the product page."),
          isNullable = true
        ),
        "/template_suffix"
      ),
      ShopifyColumn(
        StringColumn(
          "title",
          "title",
          Some("The name of the product."),
          isNullable = true
        ),
        "/title"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the product was last modified."),
          isNullable = true
        ),
        "/updated_at"
      ),
      ShopifyColumn(
        StringColumn(
          "variants",
          "variants",
          Some("An array of product variants, each representing a different version of the product."),
          isNullable = true
        ),
        "/variants"
      ),
      ShopifyColumn(
        StringColumn(
          "vendor",
          "vendor",
          Some("The name of the product's vendor."),
          isNullable = true
        ),
        "/vendor"
      )
    )
}
