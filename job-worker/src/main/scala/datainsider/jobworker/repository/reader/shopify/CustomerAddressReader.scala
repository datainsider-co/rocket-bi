package datainsider.jobworker.repository.reader.shopify

import com.fasterxml.jackson.databind.JsonNode
import com.shopify.ShopifySdk
import com.shopify.exceptions.ShopifyClientException
import com.shopify.model.{ShopifyGetRequest, ShopifyPage}
import com.twitter.util.logging.Logging
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{BoolColumn, DateTimeColumn, DoubleColumn, Int64Column, StringColumn}
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.shopify.{ShopifyColumn, ShopifyJsonParser}
import datainsider.jobworker.repository.reader.shopify.ShopifyReader.ImplicitJsonNode
import datainsider.jobworker.util.StringUtils

import scala.jdk.CollectionConverters.{asScalaBufferConverter, asScalaIteratorConverter}

class CustomerAddressReader(client: ShopifySdk, limitSize: Int = 250) extends ShopifyReader with Logging {

  override def getTableSchema(organizationId: Long, dbName: String, tblName: String): TableSchema = {
    return new TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = organizationId,
      displayName = StringUtils.getOriginTblName(tblName),
      columns = CustomerAddressReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchCustomerAddresses(lastSyncedValue)((customerId: String, addresses: Seq[JsonNode]) => {
      if (addresses.nonEmpty) {
        val records: Seq[Record] = addresses.map(CustomerAddressReader.serialize)
        currentLatestId = ShopifyReader.max(customerId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })

  }

  @throws[ShopifyClientException]
  private def fetchCustomerAddresses(lastId: Option[String])(handler: (String, Seq[JsonNode]) => Unit): Unit = {
    val request: ShopifyGetRequest =
      ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withFields("id,addresses").withLimit(limitSize).build()
    while (true) {
      val customers: ShopifyPage[JsonNode] = client.getCustomers(request)
      customers.asScala
        .filter(_.at("/id").isExists())
        .filter(_.at("/addresses").isExists())
        .foreach(customer => {
          val customerId: String = customer.at("/id").asText()
          val addresses: Seq[JsonNode] = customer.at("/addresses").iterator().asScala.toSeq
          handler(customerId, addresses)
        })

      if (customers.isEmpty || customers.getNextPageInfo == null) {
        // break;
        return;
      } else {
        // start next page
        request.setSinceId(null)
        request.setPageInfo(customers.getNextPageInfo)
      }
    }
  }
}

object CustomerAddressReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        StringColumn(
          "address1",
          "address1",
          Some("The customer's mailing address"),
          defaultValue = None,
          isNullable = true
        ),
        "/address1"
      ),
      ShopifyColumn(
        StringColumn(
          "address2",
          "address2",
          Some("An additional field for the customer's mailing address."),
          defaultValue = None,
          isNullable = true
        ),
        "/address2"
      ),
      ShopifyColumn(
        StringColumn(
          "city",
          "city",
          Some("The customer's city, town, or village."),
          defaultValue = None,
          isNullable = true
        ),
        "/city"
      ),
      ShopifyColumn(
        StringColumn("company", "company", Some("The customer's company."), defaultValue = None, isNullable = true),
        "/company"
      ),
      ShopifyColumn(
        StringColumn("country", "country", Some("The customer's country."), defaultValue = None, isNullable = true),
        "/country"
      ),
      ShopifyColumn(
        StringColumn(
          "country_code",
          "country_code",
          Some("The two-letter country code corresponding to the customer's country."),
          defaultValue = None,
          isNullable = true
        ),
        "/country_code"
      ),
      ShopifyColumn(
        StringColumn(
          "country_name",
          "country_name",
          Some("The customer's normalized country name."),
          defaultValue = None,
          isNullable = true
        ),
        "/country_name"
      ),
      ShopifyColumn(
        Int64Column(
          "id",
          "id",
          Some("A unique identifier for the address."),
          defaultValue = None,
          isNullable = true
        ),
        "/id"
      ),
      ShopifyColumn(
        StringColumn(
          "first_name",
          "first_name",
          Some("The customer's first name."),
          defaultValue = None,
          isNullable = true
        ),
        "/first_name"
      ),
      ShopifyColumn(
        StringColumn(
          "last_name",
          "last_name",
          Some("The customer's last name."),
          defaultValue = None,
          isNullable = true
        ),
        "/last_name"
      ),
      ShopifyColumn(
        StringColumn(
          "name",
          "name",
          Some("The customer's first and last names."),
          defaultValue = None,
          isNullable = true
        ),
        "/name"
      ),
      ShopifyColumn(
        StringColumn(
          "phone",
          "phone",
          Some("The customer's phone number at this address."),
          defaultValue = None,
          isNullable = true
        ),
        "/phone"
      ),
      ShopifyColumn(
        StringColumn(
          "province",
          "province",
          Some("The customer's region name. Typically a province, a state, or a prefecture."),
          defaultValue = None,
          isNullable = true
        ),
        "/province"
      ),
      ShopifyColumn(
        StringColumn(
          "province_code",
          "province_code",
          Some("The two-letter code for the customer's region."),
          defaultValue = None,
          isNullable = true
        ),
        "/province_code"
      ),
      ShopifyColumn(
        StringColumn(
          "zip",
          "zip",
          Some("The customer's postal code, also known as zip, postcode, Eircode, etc."),
          defaultValue = None,
          isNullable = true
        ),
        "/zip"
      ),
      ShopifyColumn(
        Int64Column(
          "customer_id",
          "customer_id",
          Some("The unique identifier for the customer."),
          defaultValue = None,
          isNullable = true
        ),
        "/customer_id"
      )
    )
}
