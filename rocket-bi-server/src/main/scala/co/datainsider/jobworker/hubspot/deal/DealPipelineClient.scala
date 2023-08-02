package co.datainsider.jobworker.hubspot.deal

import co.datainsider.jobworker.hubspot.client.{HubspotClient, NobodyResponse, Response}
import co.datainsider.jobworker.hubspot.util.JsonUtil.JsonObject

/**
 * Created by phuonglam on 2/17/17.
 **/
trait DealPipelineClient extends HubspotClient {
  private val pipelineBaseUrl = s"$apiUrl/deals/v1/pipelines"

  def createDealPipeline(dealPipeline: DealPipeline): Response[DealPipeline] = http.POST[DealPipeline](
    pipelineBaseUrl, dealPipeline.toJsonString
  )

  def updateDealPipeline(pipelineId: String, dealPipeline: DealPipeline): Response[DealPipeline] = http.PUT[DealPipeline](
    s"$pipelineBaseUrl/$pipelineId", dealPipeline.toJsonString
  )

  def deleteDealPipeline(pipelineId: String): Response[NobodyResponse] = http.DELETE[NobodyResponse](s"$pipelineBaseUrl/$pipelineId")

  def getDealPipeline(pipelineId: String): Response[DealPipeline] = http.GET[DealPipeline](s"$pipelineBaseUrl/$pipelineId")

  def getAllDealPipeline: Response[Seq[DealPipeline]] = http.GET[Seq[DealPipeline]](s"$pipelineBaseUrl")
}
