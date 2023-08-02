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

// docs: https://shopify.dev/api/admin-rest/2022-04/resources/report#top
class ReportReader(
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
      columns = ReportReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
    reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")
    fetchReports(lastSyncedValue)((reports: Seq[JsonNode]) => {
      if (reports.nonEmpty) {
        val records: Seq[Record] = reports.map(ReportReader.serialize)
        val reportIds: Seq[String] = reports.map(_.at("/id").asText())
        val latestId: String = ShopifyReader.getLatestId(reportIds)
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, latestId)
      }
    })

  }


  @throws[ShopifyClientException]
  private def fetchReports(lastId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val reports: ShopifyPage[JsonNode] = client.getReports(request)
      handler(reports.asScala)

      if (reports.isEmpty || reports.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(reports.getNextPageInfo)
      }

    }
  }
}

object ReportReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] = Array[ShopifyColumn](
    ShopifyColumn(
      Int64Column("id", "id", Some("The unique numeric identifier for the report."), isNullable = true),
      "/id"
    ),
    ShopifyColumn(
      StringColumn(
        "category",
        "category",
        Some("The category for the report. When you create a report, the API will return custom_app_reports."),
        isNullable = true
      ),
      "/category"
    ),
    ShopifyColumn(
      StringColumn(
        "name",
        "name",
        Some("The name of the report. Maximum length: 255 characters."),
        isNullable = true
      ),
      "/name"
    ),
    ShopifyColumn(
      StringColumn(
        "shopify_ql",
        "shopify_ql",
        Some("The ShopifyQL query that generates the report."),
        isNullable = true
      ),
      "/shopify_ql"
    ),
    ShopifyColumn(
      DateTimeColumn(
        "updated_at",
        "updated_at",
        Some("The date and time (ISO 8601) when the report was last modified."),
        isNullable = true
      ),
      "/updated_at"
    )
  )

}
