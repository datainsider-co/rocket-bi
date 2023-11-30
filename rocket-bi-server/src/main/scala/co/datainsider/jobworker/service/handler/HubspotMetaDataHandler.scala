package co.datainsider.jobworker.service.handler

import co.datainsider.jobworker.domain.Job
import co.datainsider.jobworker.service.hubspot.client.{APIKeyHubspotClient, Response}
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.InternalError

class HubspotMetaDataHandler(client: APIKeyHubspotClient) extends SourceMetadataHandler
    with Logging {

  override def testConnection(): Future[Boolean] = Future {
    val response: Response[JsonNode] = client.GET("https://api.hubapi.com/crm/v3/objects/contacts?limit=1")
    if (response.isError) {
      val errorMsg = response.error.map(_.message).getOrElse("Unknown error when test connection, please check your api key")
      throw InternalError(errorMsg)
    } else {
      true
    }
  }

  override def listDatabases(): Future[Seq[String]] = Future.Nil

  override def listTables(databaseName: String): Future[Seq[String]] = Future.Nil

  override def listColumn(databaseName: String, tableName: String): Future[Seq[String]] = Future.Nil

  override def testJob(job: Job): Future[Boolean] = Future.True
}
