package com.ptl.hubspot.association

import com.ptl.hubspot.client.{HubspotClient, Response}
import com.ptl.util.JsonUtil._

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
