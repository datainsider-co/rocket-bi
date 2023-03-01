package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{DateTimeColumn, DoubleColumn, Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.repository.reader.shopify.ShopifyReader.ImplicitJsonNode
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.{asScalaBufferConverter, asScalaIteratorConverter}

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/product-image#top
class ProductImageReader(
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
      columns = ProductImageReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchProductImages(lastSyncedValue)((productId: String, images: Seq[JsonNode]) => {
      val records: Seq[Record] = images.map(ProductImageReader.serialize)
      currentLatestId = ShopifyReader.max(productId, currentLatestId)
      reportData(records, currentLatestId)
    })
  }


  @throws[ShopifyClientException]
  private def fetchProductImages(lastId: Option[String])(handler: (String, Seq[JsonNode]) => Unit): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val products: ShopifyPage[JsonNode] = client.getProducts(request)
      products.asScala
        .filter(_.at("/id").isExists())
        .filter(_.at("/images").isExists())
        .foreach(product => {
          val productId: String = product.at("/id").asText()
          val images: Seq[JsonNode] = product.at("/images").iterator().asScala.toSeq
          handler(productId, images)
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

object ProductImageReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Some("A unique numeric identifier for the product image."),
          isNullable = false
        ),
        "/id"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time when the product image was created. The API returns this value in ISO 8601 format."),
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        Int64Column(
          "position",
          "position",
          Some(
            "The order of the product image in the list. The first product image is at position 1 and is the \"main\" image for the product."
          ),
          isNullable = true
        ),
        "/position"
      ),
      ShopifyColumn(
        Int64Column(
          "product_id",
          "product_id",
          Some("The id of the product associated with the image."),
          isNullable = true
        ),
        "/product_id"
      ),
      ShopifyColumn(
        StringColumn(
          "variant_ids",
          "variant_ids",
          Some("An array of variant ids associated with the image."),
          isNullable = true
        ),
        "/variant_ids"
      ),
      ShopifyColumn(
        StringColumn(
          "src",
          "src",
          Some("Specifies the location of the product image."),
          isNullable = true
        ),
        "/src"
      ),
      ShopifyColumn(
        DoubleColumn(
          "width",
          "width",
          Some("Width dimension of the image which is determined on upload."),
          isNullable = true
        ),
        "/width"
      ),
      ShopifyColumn(
        DoubleColumn(
          "height",
          "height",
          Some(
            "Height dimension of the image which is determined on upload."
          ),
          isNullable = true
        ),
        "/height"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some(
            "The date and time when the product image was last modified. The API returns this value in ISO 8601 format."
          ),
          isNullable = true
        ),
        "/updated_at"
      )
    )
}
