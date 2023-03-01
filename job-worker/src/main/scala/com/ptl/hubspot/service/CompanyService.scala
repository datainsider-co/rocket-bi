package com.ptl.hubspot.service

import com.ptl.hubspot.client.{APIKetHubspotClient, HubspotClient}
import com.ptl.hubspot.company.{Company, CompanyClient}
import com.ptl.hubspot.property.{HsPropertyInfo, PropertiesClient}

/**
 * Created by phg on 7/2/21.
 **/
case class CompanyService(client: HubspotClient with CompanyClient with PropertiesClient) extends HsService {

  def fetchRecent(since: Long, offset: Option[Long] = None)(result: Seq[Company] => Unit, failure: String => Unit): Unit = {
    exec {
      client.getRecent(since = since, offset = offset)
    }(res => {
      result(res.results)
      if (res.hasMore) fetchRecent(since, Some(res.offset))(result, failure)
    }, failure)
  }

  def fetchProperties(result: Seq[HsPropertyInfo] => Unit, failure: String => Unit): Unit = {
    exec(client.getCompanyProperties)(result, failure)
  }
}

object CompanyService {
  def apply(apiKey: String, debug: Boolean = false): CompanyService = CompanyService(
    new APIKetHubspotClient(apiKey, debug = debug) with CompanyClient with PropertiesClient
  )
}
