package com.ptl.hubspot.engagement

import com.ptl.hubspot.client._

/**
 * Created by phuonglam on 3/3/17.
 **/
trait EngagementClient extends HubspotClient {
  private val url = s"$apiUrl/engagements/v1/engagements"

  def getAllEngagement(limit: Option[Int] = None, offset: Option[Long] = None) = http.GET[GetEngagementResponse](
    s"$url/paged", ParamBuilder()
      .add("limit", limit)
      .add("offset", offset)
      .build()
  )

  def getRecentEngagement(count: Int = 100, offset: Option[Long] = None, since: Option[Long] = None): Response[GetEngagementResponse] = {
    if (offset.isDefined && offset.get >= 10000) {
      return Response[GetEngagementResponse](data = Some(GetEngagementResponse(Nil, offset.get, false, total = None)))
    }
    http.GET[GetEngagementResponse](
      s"$url/recent/modified", ParamBuilder()
        .add("count", count)
        .add("offset", offset)
        .add("since", since)
        .build()
    )
  }

  def getEngagement(id: Long): Response[Engagement] = http.GET[Engagement](s"$url/$id")

  def createEngagement(req: CreateEngagementRequest): Response[Engagement] = {
    req.cookies match {
      case Some(cookies) =>
        http.POST[Engagement](url, req.source,
          ParamBuilder().add("portalId", req.portalId).build(),
          headers = buildBasicHeaders(cookies))
      case _ =>
        http.POST[Engagement](url, req.source,
          ParamBuilder().add("portalId", req.portalId).build())
    }
  }

  def updateEngagement(req: UpdateEngagementRequest): Response[Unit] = {
    req.cookies match {
      case Some(cookies) =>
        http.PATCH[Unit](url, req.source, ParamBuilder().build(),
          headers = buildBasicHeaders(cookies))
      case _ =>
        http.PATCH[Unit](url, req.source, ParamBuilder().build())
    }
  }
}