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

class CustomerReader(client: ShopifySdk, limitSize: Int = 250) extends ShopifyReader with Logging {

  override def getTableSchema(organizationId: Long, dbName: String, tblName: String): TableSchema = {
    return new TableSchema(
      name = tblName,
      dbName = dbName,
      organizationId = organizationId,
      displayName = StringUtils.getOriginTblName(tblName),
      columns = CustomerReader.LIST_COLUMNS.map(_.column)
    );
  }

  override def bulkRead(lastSyncedValue: Option[String] = None)(
      reportData: (Seq[Record], String) => Unit
  ) = {
    var currentLatestId: String = lastSyncedValue.getOrElse("")

    fetchCustomers(lastSyncedValue)((customers: Seq[JsonNode]) => {
      if (customers.nonEmpty) {
        val records: Seq[Record] = customers.map(CustomerReader.serialize)
        val latestId: String = ShopifyReader.getLatestId(customers.map(_.at("/id").asText()))
        currentLatestId = ShopifyReader.max(latestId, currentLatestId)
        reportData(records, currentLatestId)
      }
    })

  }

  @throws[ShopifyClientException]
  private def fetchCustomers(lastId: Option[String])(handler: (Seq[JsonNode] => Unit)): Unit = {
    val request: ShopifyGetRequest = ShopifyGetRequest.newBuilder().withSinceId(lastId.orNull).withLimit(limitSize).build()
    while (true) {
      val customers: ShopifyPage[JsonNode] = client.getCustomers(request)
      handler(customers.asScala)

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

object CustomerReader {
  def serialize(data: JsonNode): Record = {
    return LIST_COLUMNS.map(shopifyColumn => ShopifyJsonParser.parse(shopifyColumn, data))
  }

  private val LIST_COLUMNS: Array[ShopifyColumn] =
    Array[ShopifyColumn](
      ShopifyColumn(
        Int64Column("id", "id", Some("A unique identifier for the customer."), isNullable = true),
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
          "email",
          "email",
          Some(
            "The unique email address of the customer. Attempting to assign the same email address to multiple customers returns an error."
          ),
          defaultValue = None,
          isNullable = true
        ),
        "/email"
      ),
      ShopifyColumn(
        Int64Column(
          "last_order_id",
          "last_order_id",
          Some("The ID of the customer's last order."),
          defaultValue = None,
          isNullable = true
        ),
        "/last_order_id"
      ),
      ShopifyColumn(
        StringColumn(
          "last_order_name",
          "last_order_name",
          Some(
            "The name of the customer's last order. This is directly related to the name field on the Order resource."
          ),
          defaultValue = None,
          isNullable = true
        ),
        "/last_order_name"
      ),
      ShopifyColumn(
        StringColumn(
          "metafield",
          "metafield",
          Some("Attaches additional metadata to a shop's resources."),
          defaultValue = None,
          isNullable = true
        ),
        "/metafield"
      ),
      ShopifyColumn(
        BoolColumn(
          "accepts_marketing",
          "accepts_marketing",
          Some("Whether the customer has consented to receive marketing material by email."),
          None,
          isNullable = true
        ),
        "/accepts_marketing"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "accepts_marketing_updated_at",
          "accepts_marketing_updated_at",
          Some(
            "The date and time (ISO 8601 format) when the customer consented or objected to receiving marketing material by email. Set this value whenever the customer consents or objects to marketing materials."
          ),
          None,
          isNullable = true
        ),
        "/accepts_marketing_updated_at"
      ),
      ShopifyColumn(
        StringColumn(
          "email_marketing_consent_state",
          "email_marketing_consent_state",
          Some("The current email marketing state for the customer."),
          None,
          isNullable = true
        ),
        "/email_marketing_consent/state"
      ),
      ShopifyColumn(
        StringColumn(
          "email_marketing_consent_opt_in_level",
          "email_marketing_consent_opt_in_level",
          Some(
            "The marketing subscription opt-in level, as described in the M3AAWG Sender Best Common Practices, that the customer gave when they consented to receive marketing material by email."
          ),
          defaultValue = None,
          isNullable = true
        ),
        "/email_marketing_consent/opt_in_level"
      ),
      ShopifyColumn(
        StringColumn(
          "email_marketing_consent_updated_at",
          "email_marketing_consent_updated_at",
          Some(
            "The date and time when the customer consented to receive marketing material by email. If no date is provided, then the date and time when the consent information was sent is used."
          ),
          defaultValue = None,
          isNullable = true
        ),
        "/email_marketing_consent/consent_updated_at"
      ),
      ShopifyColumn(
        StringColumn(
          "addresses",
          "addresses",
          Some("A list of the ten most recently updated addresses for the customer."),
          defaultValue = None,
          isNullable = true
        ),
        "/addresses"
      ),
      ShopifyColumn(
        StringColumn(
          "currency",
          "currency",
          Some(
            "The three-letter code (ISO 4217 format) for the currency that the customer used when they paid for their last order. Defaults to the shop currency. Returns the shop currency for test orders."
          ),
          defaultValue = None,
          isNullable = true
        ),
        "/currency"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "created_at",
          "created_at",
          Some("The date and time (ISO 8601 format) when the customer was created."),
          defaultValue = None,
          isNullable = true
        ),
        "/created_at"
      ),
      ShopifyColumn(
        StringColumn(
          "address1",
          "address1",
          Some("The first line of the customer's mailing address."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/address1"
      ),
      ShopifyColumn(
        StringColumn(
          "address2",
          "address2",
          Some("An additional field for the customer's mailing address."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/address2"
      ),
      ShopifyColumn(
        StringColumn(
          "city",
          "city",
          Some("The customer's city, town, or village."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/city"
      ),
      ShopifyColumn(
        StringColumn("company", "company", Some("The customer's company."), defaultValue = None, isNullable = true),
        "/default_address/company"
      ),
      ShopifyColumn(
        StringColumn("country", "country", Some("The customer's country."), defaultValue = None, isNullable = true),
        "/default_address/country"
      ),
      ShopifyColumn(
        StringColumn(
          "country_code",
          "country_code",
          Some("The two-letter country code corresponding to the customer's country."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/country_code"
      ),
      ShopifyColumn(
        StringColumn(
          "country_name",
          "country_name",
          Some("The customer's normalized country name."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/country_name"
      ),
      ShopifyColumn(
        Int64Column(
          "address_id",
          "address_id",
          Some("A unique identifier for the address."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/id"
      ),
      ShopifyColumn(
        StringColumn(
          "address_first_name",
          "address_first_name",
          Some("The customer's first name."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/first_name"
      ),
      ShopifyColumn(
        StringColumn(
          "address_last_name",
          "address_last_name",
          Some("The customer's last name."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/last_name"
      ),
      ShopifyColumn(
        StringColumn(
          "address_name",
          "address_name",
          Some("The customer's first and last names."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/name"
      ),
      ShopifyColumn(
        StringColumn(
          "address_phone",
          "address_phone",
          Some("The customer's phone number at this address."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/phone"
      ),
      ShopifyColumn(
        StringColumn(
          "province",
          "province",
          Some("The customer's region name. Typically a province, a state, or a prefecture."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/province"
      ),
      ShopifyColumn(
        StringColumn(
          "province_code",
          "province_code",
          Some("The two-letter code for the customer's region."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/province_code"
      ),
      ShopifyColumn(
        StringColumn(
          "zip",
          "zip",
          Some("The customer's postal code, also known as zip, postcode, Eircode, etc."),
          defaultValue = None,
          isNullable = true
        ),
        "/default_address/zip"
      ),
      ShopifyColumn(
        StringColumn(
          "multipass_identifier",
          "multipass_identifier",
          Some("A unique identifier for the customer that's used with ' 'Multipass login."),
          defaultValue = None,
          isNullable = true
        ),
        "/multipass_identifier"
      ),
      ShopifyColumn(
        StringColumn("note", "note", Some("A note about the customer."), defaultValue = None, isNullable = true),
        "/note"
      ),
      ShopifyColumn(
        Int64Column(
          "orders_count",
          "orders_count",
          Some("The number of orders associated with this customer. Test and archived orders aren't counted."),
          defaultValue = None,
          isNullable = true
        ),
        "/orders_count"
      ),
      ShopifyColumn(
        StringColumn(
          "phone",
          "phone",
          Some("The unique phone number (E.164 format) for this customer."),
          defaultValue = None,
          isNullable = true
        ),
        "/phone"
      ),
      ShopifyColumn(
        StringColumn(
          "sms_marketing_consent",
          "sms_marketing_consent",
          Some("The marketing consent information when the customer consented to receiving marketing material by SMS."),
          defaultValue = None,
          isNullable = true
        ),
        "/sms_marketing_consent"
      ),
      ShopifyColumn(
        StringColumn(
          "state",
          "state",
          Some("The state of the customer's account with a shop."),
          defaultValue = None,
          isNullable = true
        ),
        "/state"
      ),
      ShopifyColumn(
        StringColumn(
          "tags",
          "tags",
          Some("Tags that the shop owner has attached to the customer."),
          defaultValue = None,
          isNullable = true
        ),
        "/tags"
      ),
      ShopifyColumn(
        BoolColumn(
          "tax_exempt",
          "tax_exempt",
          Some("Whether the customer is exempt from paying taxes on their order."),
          defaultValue = None,
          isNullable = true
        ),
        "/tax_exempt"
      ),
      ShopifyColumn(
        StringColumn(
          "tax_exemptions",
          "tax_exemptions",
          Some("Whether the customer is exempt from paying specific taxes on their order. Canadian taxes only."),
          defaultValue = None,
          isNullable = true
        ),
        "/tax_exemptions"
      ),
      ShopifyColumn(
        DoubleColumn(
          "total_spent",
          "total_spent",
          Some("The total amount of money that the customer has spent across their order history."),
          defaultValue = None,
          isNullable = true
        ),
        "/total_spent"
      ),
      ShopifyColumn(
        DateTimeColumn(
          "updated_at",
          "updated_at",
          Some("The date and time (ISO 8601 format) when the customer information was last updated."),
          defaultValue = None,
          isNullable = true
        ),
        "/updated_at"
      ),
      ShopifyColumn(
        BoolColumn(
          "verified_email",
          "verified_email",
          Some("Whether the customer has verified their email address."),
          defaultValue = None,
          isNullable = true
        ),
        "/verified_email"
      )
    )
}
