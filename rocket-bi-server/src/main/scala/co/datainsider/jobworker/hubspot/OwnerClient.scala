package co.datainsider.jobworker.hubspot

import co.datainsider.jobworker.hubspot.client.{HubspotClient, ParamBuilder, Response}
import com.fasterxml.jackson.databind.annotation.JsonNaming

/**
 * Created by phuonglam on 3/2/17.
 **/
trait OwnerClient extends HubspotClient {
  private val url = s"$apiUrl/owners/v2/owners"

  def getAllOwner: Response[Seq[Owner]] = http.GET[Seq[Owner]](url)

  def getOwner(id: Long): Response[Owner] = http.GET[Owner](s"$url/$id")

  def getOwner(cookies: String, portalId: Long): Response[Owner] = {
    http.GET[Owner](s"$url/current/remotes",
      ParamBuilder().add("portalId", portalId).build(),
      headers = buildBasicHeaders(cookies)
    )
  }

  def getOwnerByEmail(email: String): Response[Seq[Owner]] = {
    http.GET[Seq[Owner]](s"$url", ParamBuilder().add("email", email).build())
  }
}

@JsonNaming
case class Owner(
  portalId: Long,
  ownerId: Long,
  `type`: String,
  firstName: String,
  lastName: String,
  fullName: String,
  avatar: String,
  email: String,
  createdAt: Long,
  updatedAt: Long,
  signature: String,
  hasContactsAccess: Boolean,
  isSale: Boolean = false
)
