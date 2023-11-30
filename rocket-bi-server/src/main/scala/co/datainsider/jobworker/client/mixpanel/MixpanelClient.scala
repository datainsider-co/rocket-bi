package co.datainsider.jobworker.client.mixpanel

import co.datainsider.jobscheduler.domain.source.MixpanelRegion
import co.datainsider.jobworker.client.HttpClientError
import co.datainsider.jobworker.domain.source.MixpanelSource
import com.fasterxml.jackson.databind.JsonNode
import datainsider.client.exception.{DIException, UnsupportedError}

import java.nio.file.Path

trait MixpanelClient {
  @throws[HttpClientError]("if cannot get engagement from mixpanel")
  def getEngagement(request: GetEngagementRequest): EngagementResponse

  /**
    * export data to tmp file
    * @param request export request
    * @return path to the file
    */
  @throws[DIException]("if cannot export data from mixpanel")
  def export(request: ExportRequest): Path

  def getProfile(): MixpanelResponse[JsonNode]
}

object MixpanelClient {
  def create(source: MixpanelSource): MixpanelClient = {
    source.region match {
      case MixpanelRegion.US => new USMixpanelClient(source.accountUsername, source.accountSecret)
      case MixpanelRegion.EU => new EUMixpanelClient(source.accountUsername, source.accountSecret)
      case _                 => throw new UnsupportedError(s"Unsupported mixpanel client for region: ${source.region}")
    }
  }
}
