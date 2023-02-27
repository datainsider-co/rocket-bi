package datainsider.jobworker.service.handlers

import com.twitter.inject.Test
import datainsider.jobworker.domain._
import datainsider.jobworker.service.handler.SourceMetadataHandler
import datainsider.jobworker.util.ZConfig

class ShopifyMetadataHandlerTest extends Test {

  val apiUrl = ZConfig.getString("database_test.shopify.api_url")
  val accessToken = ZConfig.getString("database_test.shopify.access_token")
  val apiVersion = ZConfig.getString("database_test.shopify.api_version")

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
