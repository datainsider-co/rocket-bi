package com.ptl.hubspot.ticket

import com.fasterxml.jackson.databind.annotation.JsonNaming
import com.ptl.hubspot.client.{HubspotClient, Response}
import com.ptl.util.JsonUtil._

/**
 * Created by phg on 3/11/19.
 **/
trait TicketClient extends HubspotClient {
  private val ticketUrl = s"$apiUrl/crm-objects/v1/objects/tickets"

  def createTicket(data: Seq[CreateTicketProperty]): Response[CrmObject] = {
    val json = data.toJsonString
    println(json)
    http.POST[CrmObject](ticketUrl, json)
  }
}

case class CreateTicketProperty(name: String, value: String)

object TicketField {
  val SUBJECT = "subject"
  val CREATED_BY = "created_by"
  val CONTENT = "content"
  val status = "status"
  val PIPELINE = "hs_pipeline"
  val STAGE = "hs_pipeline_stage"
  val HUBSPOT_OWNER_ID = "hubspot_owner_id"
}

@JsonNaming
case class CrmObject(
  objectType: String,
  portalId: Long,
  objectId: Long,
  isDeleted: Boolean,
  properties: Map[String, Object]
)
