package co.datainsider.jobworker.hubspot.association

import co.datainsider.jobworker.hubspot.client.{HubspotClient, Response}
import co.datainsider.jobworker.hubspot.util.JsonUtil.JsonObject

/**
 * Created by phg on 3/11/19.
 **/
trait AssociationClient extends HubspotClient {
  def createAssociation(from: Long, to: Long, definitionId: Int): Response[Unit] = {
    http.PUT[Unit](s"$apiUrl/crm-associations/v1/associations", Map(
      "fromObjectId" -> from,
      "toObjectId" -> to,
      "category" -> "HUBSPOT_DEFINED",
      "definitionId" -> definitionId
    ).toJsonString)
  }
}
