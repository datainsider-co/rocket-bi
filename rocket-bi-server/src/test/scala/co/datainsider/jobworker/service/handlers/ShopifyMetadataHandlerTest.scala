package co.datainsider.jobworker.service.handlers

import co.datainsider.jobworker.domain.job.{ShopifyJob, ShopifyTable}
import co.datainsider.jobworker.domain.source.ShopifySource
import co.datainsider.jobworker.domain.{DataDestination, JobStatus, JobType}
import co.datainsider.jobworker.service.handler.SourceMetadataHandler
import co.datainsider.bi.util.ZConfig
import com.twitter.inject.Test

class ShopifyMetadataHandlerTest extends Test {

  val apiUrl = ZConfig.getString("test_db.shopify.api_url")
  val accessToken = ZConfig.getString("test_db.shopify.access_token")
  val apiVersion = ZConfig.getString("test_db.shopify.api_version")

  val source = ShopifySource(12, 121217, "ShopifyWorker", apiUrl, accessToken, apiVersion)


  val sourceHandler: SourceMetadataHandler = SourceMetadataHandler(source)

  test("Shopify test connection") {
    val isConnected = await(sourceHandler.testConnection())
    assert(isConnected)
  }

  test("Shopify list databases") {
    val dbs: Seq[String] = await(sourceHandler.listDatabases())
    assert(dbs.nonEmpty)
    assert(dbs.contains("shopify"))
  }

  test("Shopify test list table") {
    val tables: Seq[String] = await(sourceHandler.listTables("shopify"))
    assert(tables.nonEmpty)
    assert(!tables.contains(ShopifyTable.GiftCard.toString))
    assert(!tables.contains(ShopifyTable.User.toString))
  }

  test("Shopify test job") {
    val job = ShopifyJob(
      1,
      jobId = 0,
      jobType = JobType.Shopify,
      sourceId = 0L,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 60,
      lastSyncStatus = JobStatus.Init,
      destinations = Seq(DataDestination.Clickhouse),
      currentSyncStatus = JobStatus.Init,
      tableName = ShopifyTable.User,
      lastSyncedValue = "0",
    )
    val isConnected = await(sourceHandler.testJob(job))
    assert(isConnected)
  }
}
