package co.datainsider.jobworker.hubspot.property

import co.datainsider.jobworker.hubspot.client.{HubspotClient, Response}
import com.fasterxml.jackson.annotation.JsonProperty

/**
 * Created by phg on 11/19/18.
 **/
trait PropertiesClient extends HubspotClient {

  private val propertiesBaseUrl = s"$apiUrl/properties/v1"

  def getContactProperties: Response[Seq[HsPropertyInfo]] = http.GET[Seq[HsPropertyInfo]](
    path = s"$propertiesBaseUrl/contacts/properties"
  )

  def getDealProperties: Response[Seq[HsPropertyInfo]] = http.GET[Seq[HsPropertyInfo]](
    path = s"$propertiesBaseUrl/deals/properties"
  )

  def getCompanyProperties: Response[Seq[HsPropertyInfo]] = http.GET[Seq[HsPropertyInfo]](
    path = s"$propertiesBaseUrl/companies/properties"
  )
}

@JsonProperty
case class HsPropertyInfo(
  name: String,
  label: String,
  description: String,
  deleted: Boolean,
  `type`: String
)
