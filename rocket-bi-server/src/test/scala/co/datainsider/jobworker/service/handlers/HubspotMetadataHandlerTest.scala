package co.datainsider.jobworker.service.handlers

import co.datainsider.jobworker.service.handler.{HubspotMetaDataHandler, SourceMetadataHandler}
import co.datainsider.jobworker.service.hubspot.client.APIKeyHubspotClient
import com.twitter.inject.Test
import datainsider.client.exception.InternalError

class HubspotMetadataHandlerTest extends Test {

  test("test connection success") {
    val sourceHandler: SourceMetadataHandler = new HubspotMetaDataHandler(new APIKeyHubspotClient("pat-na1-5a7c134c-9be6-48d0-aa44-e1d37c591e76"))
    assertFutureValue(sourceHandler.testConnection(), true)
  }


  test("Test connection failure") {
    val sourceHandler: SourceMetadataHandler = new HubspotMetaDataHandler(new APIKeyHubspotClient("pat-na1-076f5f97-318e-490c-a9d8-ce2e67486689"))
    assertFailedFuture[Throwable](sourceHandler.testConnection())
  }
}
