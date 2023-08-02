package co.datainsider.jobworker.hubspot.deal

import co.datainsider.jobworker.hubspot.client.{HubspotClient, NobodyResponse, ParamBuilder, Response}
import co.datainsider.jobworker.hubspot.util.JsonUtil.JsonObject

/**
 * Created by phuonglam on 2/16/17.
 **/
trait DealClient extends HubspotClient {
  private val dealBaseUrl = s"$apiUrl/deals/v1"

  private def _get[A: Manifest](url: String, req: GetDealRequest): Response[A] = {
    http.GET[A](url, ParamBuilder()
      .add("limit", req.limit)
      .add("offset", req.offset)
      .add("properties", req.properties)
      .add("propertiesWithHistory", req.propertiesWithHistory)
      .add("includeAssociations", req.includeAssociations)
      .add("since", req.since)
      .build()
    )
  }

  def createDeal[A: Manifest](req: CreateDealRequest[A]): Response[Deal] = http.POST[Deal](
    s"$dealBaseUrl/deal", req.toJsonString
  )

  def updateDeal[A: Manifest](req: UpdateDealRequest[A]): Response[Deal] = http.PUT[Deal](
    s"$dealBaseUrl/deal/${req.dealId}", req.toJsonString
  )

  def deleteDeal(dealId: Long): Response[NobodyResponse] = http.DELETE[NobodyResponse](s"$dealBaseUrl/deal/$dealId")

  def getDeal(dealId: Long, includePropertyVersions: Option[Boolean] = None): Response[Deal] =
    http.GET[Deal](s"$dealBaseUrl/deal/$dealId", ParamBuilder()
      .add("includePropertyVersions", includePropertyVersions)
      .build())

  def getAllDeal(req: GetDealRequest): Response[GetDealResponse] = _get[GetDealResponse](s"$dealBaseUrl/deal/paged", req)

  def getRecentModifiedDeal(req: GetDealRequest): Response[RecentDealResponse] = _get[RecentDealResponse](s"$dealBaseUrl/deal/recent/modified", req)

  def getRecentCreatedDeal(req: GetDealRequest): Response[RecentDealResponse] = _get[RecentDealResponse](s"$dealBaseUrl/deal/recent/created", req)

  def getAssociatedDeal(objectType: String, associationId: Long, req: GetDealRequest): Response[GetDealResponse] = http.GET[GetDealResponse](
    s"$dealBaseUrl/deal/associated/$objectType/$associationId/paged"
  )

  def associateDeal(dealId: Long, objectType: String, associationIds: Seq[Long]): Response[NobodyResponse] = http.PUT[NobodyResponse](
    s"$dealBaseUrl/deal/$dealId/associations/${objectType.toUpperCase()}?id=${associationIds.mkString("&id=")}", ""
  )

  def removeDealAssociation(dealId: Long, objectType: String, associationIds: Seq[Long]): Response[NobodyResponse] = http.DELETE[NobodyResponse](
    s"$dealBaseUrl/deal/$dealId/associations/${objectType.toUpperCase()}?id=${associationIds.mkString("&id=")}"
  )
}
