package com.ptl.hubspot.service

import com.ptl.hubspot.client.{APIKetHubspotClient, HubspotClient}
import com.ptl.hubspot.contact.{Contact, ContactClient}
import com.ptl.hubspot.property.{HsPropertyInfo, PropertiesClient}

/**
 * Created by phg on 6/28/21.
 **/
case class ContactService(client: HubspotClient with ContactClient with PropertiesClient) extends HsService {

  def fetchRecent(timestamp: Long)(result: Seq[Contact] => Unit, failure: String => Unit): Unit = {
    exec {
      client.getRecentUpdateContact(timeOffset = Some(timestamp))
    }(res => {
      result(res.contacts)
      if (res.hasMore) fetchRecent(timestamp = res.timeOffset)(result, failure)
    }, failure)
  }

  def fetchAllContact(vidOffset: Option[Long] = None)(result: Seq[Contact] => Unit, failure: String => Unit): Unit = {
    exec(
      client.getAllContact(
        vidOffset = vidOffset
      )
    )(res => {
      result(res.contacts)
      if (res.hasMore) fetchAllContact(Some(res.vidOffset))(result, failure)
    }, failure)
  }

  def fetchProperties(result: Seq[HsPropertyInfo] => Unit, failure: String => Unit): Unit = {
    exec(client.getContactProperties)(result, failure)
  }
}

object ContactService {
  def apply(apiKey: String, debug: Boolean = false): ContactService = ContactService(
    new APIKetHubspotClient(apiKey, debug = debug) with ContactClient with PropertiesClient
  )
}