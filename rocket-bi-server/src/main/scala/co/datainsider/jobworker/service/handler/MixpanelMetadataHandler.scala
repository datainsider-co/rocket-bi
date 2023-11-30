package co.datainsider.jobworker.service.handler

import co.datainsider.jobworker.client.mixpanel.{MixpanelClient, MixpanelResponse}
import co.datainsider.jobworker.domain.Job
import co.datainsider.jobworker.domain.source.MixpanelSource
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.Future
import com.twitter.util.logging.Logging

class MixpanelMetadataHandler(
    source: MixpanelSource
) extends SourceMetadataHandler
    with Logging {

  override def testConnection(): Future[Boolean] =
    Future {
      val client: MixpanelClient = MixpanelClient.create(source)
      val profile: MixpanelResponse[JsonNode] = client.getProfile()
      profile != null && profile.isSuccess
    }

  override def listDatabases(): Future[Seq[String]] = Future.Nil

  override def listTables(databaseName: String): Future[Seq[String]] = Future.Nil

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = Future.Nil

  override def testJob(job: Job): Future[Boolean] = Future.False
}
