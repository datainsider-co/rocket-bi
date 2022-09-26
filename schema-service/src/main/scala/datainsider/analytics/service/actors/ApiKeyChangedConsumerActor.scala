package datainsider.analytics.service.actors

import akka.actor.Actor
import com.twitter.inject.Logging
import datainsider.analytics.service.{ReportSchemaService, TrackingSchemaService}
import datainsider.analytics.service.actors.ApiKeyChangedConsumerActor._
import datainsider.ingestion.domain.ApiKeyInfo
import datainsider.ingestion.util.Implicits.FutureEnhance

@deprecated("no longer used")
object ApiKeyChangedConsumerActor {
  case class AnalyticApiKeyCreated(apiKeyInfo: ApiKeyInfo)
}

@deprecated("no longer used")
case class ApiKeyChangedConsumerActor(
    trackingSchemaService: TrackingSchemaService,
    reportSchemaService: ReportSchemaService
) extends Actor
    with Logging {

  override def receive: Receive = {
    case AnalyticApiKeyCreated(apiKeyInfo) => onAnalyticApiKeyCreated(apiKeyInfo)
    case x                                 => logger.error(s"Received an unknown message: $x")
  }

  private def onAnalyticApiKeyCreated(apiKeyInfo: ApiKeyInfo): Unit = {
    trackingSchemaService.initialize(apiKeyInfo.organizationId).syncGet()
    reportSchemaService.createReportDatabaseIfRequired(apiKeyInfo.organizationId).syncGet()
    reportSchemaService.createReportActiveUserMetricTbl(apiKeyInfo.organizationId).syncGet()
  }

}
