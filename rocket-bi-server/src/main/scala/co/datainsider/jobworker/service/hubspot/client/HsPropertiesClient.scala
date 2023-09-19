package co.datainsider.jobworker.service.hubspot.client

import co.datainsider.jobworker.domain.HubspotObjectType.HubspotObjectType
import com.fasterxml.jackson.annotation.JsonProperty

/**
  * Created by phg on 11/19/18.
  */
trait HsPropertiesClient extends HubspotClient {

  private val propertiesBaseUrl = s"$apiUrl/crm/v3/properties"

  def getProperties(subType: HubspotObjectType): Response[HsPageResponse[HsPropertyInfo]] = {
    http.GET[HsPageResponse[HsPropertyInfo]](
      path = s"$propertiesBaseUrl/${subType.toString}"
    )
  }
}

@JsonProperty
case class HsPropertyInfo(
    name: String,
    label: String,
    description: String,
    deleted: Boolean,
    `type`: String
)

case class HsPaging(next: HsNextPage)

case class HsNextPage(after: String, link: String)

case class HsPageResponse[T](results: Seq[T], paging: Option[HsPaging])
