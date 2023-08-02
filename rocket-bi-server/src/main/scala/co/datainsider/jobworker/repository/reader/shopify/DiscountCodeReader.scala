package co.datainsider.jobworker.repository.reader.shopify

import co.datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import co.datainsider.jobworker.util.StringUtils
import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.{ShopifyClientException, ShopifyErrorResponseException}
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.{DateTimeColumn, Int64Column, StringColumn}
import co.datainsider.bi.client.JdbcClient.Record
import ShopifyReader.ImplicitJsonNode
import org.apache.http.HttpStatus

import scala.jdk.CollectionConverters.asScalaBufferConverter

//docs: https://shopify.dev/api/admin-rest/2022-04/resources/discountcode#top
class DiscountCodeReader(
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
      columns = DiscountCodeReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchDiscountCodes(lastSyncedValue)((ruleId: String, discountCodes: Seq[JsonNode]) => {
      val records: Seq[Record] = discountCodes.map(DiscountCodeReader.serialize)
      currentLatestId = ShopifyReader.max(ruleId, currentLatestId)
      reportData(records, currentLatestId)
    })
  }


  @throws[ShopifyClientException]
  private def fetchDiscountCodes(lastId: Option[String])(handler: ((String, Seq[JsonNode]) => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val priceRules: ShopifyPage[JsonNode] = client.getPriceRules(request)
      priceRules.asScala
        .filter(rule => rule.at("/id").isExists())
        .foreach(rule => {
          val discountCodes: Seq[JsonNode] = getDiscountCodes(rule.at("/id").asText())
          handler(rule.at("/id").asText(), discountCodes)
        })

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

  private def getDiscountCodes(ruleId: String): Seq[JsonNode] = {
    try {
      client.getDiscountCodes(ruleId).asScala
    } catch {
      case ex: ShopifyErrorResponseException if (HttpStatus.SC_NOT_FOUND.equals(ex.getStatusCode)) =>
        warn(s"get discount code of rule ${ruleId} not found")
        Seq.empty
    }
  }
}

object DiscountCodeReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Some("The ID for the discount code."),
          isNullable = false
        ),
        "/id"
      ),
      ShopifyColumn(
        Int64Column(
          "price_rule_id",
          "price_rule_id",
          Some("The ID for the price rule that this discount code belongs to."),
          isNullable = false
        ),
        "/price_rule_id"
      ),
      ShopifyColumn(
        Int64Column(
          "usage_count",
          "usage_count",
          Some("The number of times that the discount code has been redeemed."),
          isNullable = false
        ),
        "/usage_count"
      ),
      ShopifyColumn(
        StringColumn(
          "code",
          "code",
          Some("The case-insensitive discount code that customers use at checkout. (maximum: 255 characters)"),
          isNullable = false
        ),
        "/code"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time (ISO 8601 format) when the discount code was created."),
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the discount code was updated.\n"),
          isNullable = true
        ),
        "/updated_at"
      )
    )
}
