package co.datainsider.jobworker.service.handlers

import co.datainsider.jobworker.client.{HttpClientError, HttpClientImpl}
import co.datainsider.jobworker.client.palexy.{MockPalexyClient, PalexyClientImpl}
import co.datainsider.jobworker.domain.job.{ShopifyJob, ShopifyTable}
import co.datainsider.jobworker.domain.source.PalexySource
import co.datainsider.jobworker.domain.{DataDestination, DataSource, JobStatus, JobType}
import co.datainsider.jobworker.service.handler.{PalexyMetaDataHandler, SourceMetadataHandler}
import com.twitter.inject.Test

class PalexyMetadataHandlerTest extends Test {

  test("test connection success") {
    val source: PalexySource = PalexySource(orgId = 12, id = 121217, displayName = "ShopifyWorker", apiKey = "api-key")
    val sourceHandler: SourceMetadataHandler = new PalexyMetaDataHandler(
      client = new MockPalexyClient(),
      source = source
    )
    assertFutureValue(sourceHandler.testConnection(), true)
  }


  test("Test connection failure") {
    val source: PalexySource = PalexySource(orgId = 12, id = 121217, displayName = "ShopifyWorker", apiKey = "api-key")

    val sourceHandler: SourceMetadataHandler = new PalexyMetaDataHandler(
      client = new PalexyClientImpl(new HttpClientImpl("https://ica.palexy.com")),
      source = source
    )
    assertFailedFuture[HttpClientError](sourceHandler.testConnection())
  }
}
