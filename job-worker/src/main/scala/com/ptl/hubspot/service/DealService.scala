package com.ptl.hubspot.service

import com.ptl.hubspot.client.{APIKetHubspotClient, HubspotClient}
import com.ptl.hubspot.deal._
import com.ptl.hubspot.property.{HsPropertyInfo, PropertiesClient}

/**
 * Created by phg on 6/26/21.
 **/
case class DealService(client: HubspotClient with DealClient with DealPipelineClient with PropertiesClient) extends HsService {
  private val fields = Seq(
    "dealname",
    "customer_phone",
    "customer_email",
    "customer_name",
    "hubspot_owner_id",
    "hubspot_team_id",
    "amount",
    "amount_in_home_currency",
    "closedate",
    "createdate",
    "dealtype",
    "pipeline",
    "dealstage",
    "deal_location",
    "deal_team",
    "property_type",
    "hs_analytics_source",
    "hs_createdate",
    "hs_lastmodifieddate"
  )

  def fetchRecent(since: Long, offset: Option[Long] = None)(result: Seq[Deal] => Unit, failure: String => Unit): Unit = {
    exec {
      client.getRecentModifiedDeal(
        GetDealRequest(
          offset = offset,
          propertiesWithHistory = fields,
          since = Some(since)
        )
      )
    }(res => {
      result(res.results)
      if (res.hasMore) fetchRecent(since, Some(res.offset))(result, failure)
    }, failure)
  }

  def fetchAllDeal(result: Seq[Deal] => Unit, failure: String => Unit): Unit = {
    fetchRecent(0)(result, failure)
  }

  def fetchAllDealPipeline(result: Seq[DealPipeline] => Unit, failure: String => Unit): Unit = {
    exec(client.getAllDealPipeline)(result, failure)
  }

  def fetchProperties(result: Seq[HsPropertyInfo] => Unit, failure: String => Unit): Unit = {
    exec(client.getDealProperties)(result, failure)
  }
}

object DealService {
  def apply(apiKey: String): DealService = DealService(
    new APIKetHubspotClient(apiKey) with DealClient with DealPipelineClient with PropertiesClient
  )
}
