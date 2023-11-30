//package co.datainsider.jobworker.service.shopify
//
//import co.datainsider.jobworker.domain.job.{ShopifyJob, ShopifyTable}
//import co.datainsider.jobworker.domain.source.ShopifySource
//import co.datainsider.jobworker.domain._
//import co.datainsider.jobworker.repository.reader.shopify.ShopifyReader
//import co.datainsider.jobworker.service.worker.ShopifyWorker
//import datainsider.client.domain.Implicits.ScalaFutureLike
//
//import scala.concurrent.ExecutionContext.Implicits.global
//
//class CustomerAddressWorkerTest extends ShopifyWorkerTest {
//
//  val source = ShopifySource(12, 121217, "ShopifyWorker", apiUrl, accessToken, apiVersion)
//  val job = ShopifyJob(
//    orgId = 12,
//    jobId = 12127,
//    jobType = JobType.Shopify,
//    syncMode = SyncMode.IncrementalSync,
//    sourceId = 121217,
//    lastSuccessfulSync = 0,
//    syncIntervalInMn = 0,
//    lastSyncStatus = JobStatus.Init,
//    currentSyncStatus = JobStatus.Syncing,
//    destDatabaseName = dbName,
//    destTableName = "address_table_test_1",
//    destinations = Seq(DataDestination.Clickhouse),
//    tableName = ShopifyTable.CustomerAddress,
//    lastSyncedValue = ""
//  )
//
//  val job2 = ShopifyJob(
//    orgId = 12,
//    jobId = 12127,
//    jobType = JobType.Shopify,
//    syncMode = SyncMode.IncrementalSync,
//    sourceId = 121217,
//    lastSuccessfulSync = 0,
//    syncIntervalInMn = 0,
//    lastSyncStatus = JobStatus.Init,
//    currentSyncStatus = JobStatus.Syncing,
//    destDatabaseName = dbName,
//    destTableName = "address_table_test_2",
//    destinations = Seq(DataDestination.Clickhouse),
//    tableName = ShopifyTable.CustomerAddress,
//    lastSyncedValue = "6241305755875"
//  )
//  private val reader = ShopifyReader(source, job.tableName)
//  var lastSyncedValue = ""
//  var lastSyncedRows = 0L
//
//  override protected def ensureTableSchema(): Unit = {
//    val tableSchema = reader.getTableSchema(job.orgId, job.destDatabaseName, job.destTableName)
//    dbTestUtils.createTable(tableSchema)
//
//    val tableSchema2 = reader.getTableSchema(job2.orgId, job2.destDatabaseName, job2.destTableName)
//    dbTestUtils.createTable(tableSchema2)
//  }
//
//  test("Incremental sync customer address") {
//
//    val syncId = 12
//    await(ssdbKVS.add(syncId, true).asTwitter)
//    val worker: ShopifyWorker = createWorker(source)
//    var finishedProgress: ShopifyJobProgress = null
//    try {
//      finishedProgress = worker.run(job, syncId, reportJob);
//      println(s"finished progress is ${finishedProgress}")
//    } catch {
//      case ex =>
//        ex.printStackTrace()
//        assert(false)
//    }
//    assert(finishedProgress.jobStatus === JobStatus.Synced)
//    assert(finishedProgress.jobId === job.jobId)
//    assert(finishedProgress.syncId === syncId)
//    val isRunning: Boolean = await(ssdbKVS.get(syncId).asTwitter).getOrElse(false)
//    assert(!isRunning)
//
//    val totalRows = count(job.destDatabaseName, job.destTableName)
//    println(s"current inserted rows: ${finishedProgress.totalSyncRecord}")
//    println(s"actual total rows: ${totalRows}")
//    assert(totalRows == finishedProgress.totalSyncRecord)
//    lastSyncedRows = lastSyncedRows + finishedProgress.totalSyncRecord
//
//    val latestId = getLatestId(job.destDatabaseName, job.destTableName, "customer_id")
//    println(s"current latest id: ${finishedProgress.lastSyncedValue}")
//    println(s"actual latest id: ${latestId}")
//    assert(finishedProgress.lastSyncedValue == String.valueOf(latestId))
//    lastSyncedValue = String.valueOf(latestId)
//    ensureTableCreated(reader.getTableSchema(job.orgId, job.destDatabaseName, job.destTableName))
//
//  }
//
//  test("Incremental sync customer address from latest id") {
//
//    val syncId = 13
//    await(ssdbKVS.add(syncId, true).asTwitter)
//    val worker: ShopifyWorker = createWorker(source)
//    var finishedProgress: ShopifyJobProgress = null
//    try {
//      finishedProgress = worker.run(job.copy(lastSyncedValue = lastSyncedValue), syncId, reportJob);
//      println(s"finished progress is ${finishedProgress}")
//    } catch {
//      case ex =>
//        ex.printStackTrace()
//        assert(false)
//    }
//    assert(finishedProgress.jobStatus === JobStatus.Synced)
//    assert(finishedProgress.jobId === job.jobId)
//    assert(finishedProgress.syncId === syncId)
//    val isRunning: Boolean = await(ssdbKVS.get(syncId).asTwitter).getOrElse(false)
//    assert(!isRunning)
//
//    val totalRows = count(job.destDatabaseName, job.destTableName)
//    println(s"current inserted rows: ${finishedProgress.totalSyncRecord}")
//    println(s"actual total rows: ${totalRows}")
//    assert(totalRows == lastSyncedRows)
//
//    val latestId = getLatestId(job.destDatabaseName, job.destTableName, "customer_id")
//    println(s"current latest id: ${finishedProgress.lastSyncedValue}")
//    println(s"actual latest id: ${latestId}")
//    assert(finishedProgress.lastSyncedValue == String.valueOf(latestId))
//    ensureTableCreated(reader.getTableSchema(job.orgId, job.destDatabaseName, job.destTableName))
//
//  }
//
//  test("Incremental sync customer address from 6241305755875") {
//
//    val syncId = 13
//    await(ssdbKVS.add(syncId, true).asTwitter)
//    val worker: ShopifyWorker = createWorker(source)
//    var finishedProgress: ShopifyJobProgress = null
//    try {
//      finishedProgress = worker.run(job2, syncId, reportJob);
//      println(s"finished progress is ${finishedProgress}")
//    } catch {
//      case ex =>
//        ex.printStackTrace()
//        assert(false)
//    }
//    assert(finishedProgress.jobStatus === JobStatus.Synced)
//    assert(finishedProgress.jobId === job2.jobId)
//    assert(finishedProgress.syncId === syncId)
//    val isRunning: Boolean = await(ssdbKVS.get(syncId).asTwitter).getOrElse(false)
//    assert(!isRunning)
//
//    val totalRows = count(job2.destDatabaseName, job2.destTableName)
//    println(s"current inserted rows: ${finishedProgress.totalSyncRecord}")
//    println(s"actual total rows: ${totalRows}")
//    assert(totalRows == finishedProgress.totalSyncRecord)
//
//    val latestId = getLatestId(job2.destDatabaseName, job2.destTableName, "customer_id")
//    println(s"current latest id: ${finishedProgress.lastSyncedValue}")
//    println(s"actual latest id: ${latestId}")
//    assert(finishedProgress.lastSyncedValue == String.valueOf(latestId))
//    ensureTableCreated(reader.getTableSchema(job2.orgId, job2.destDatabaseName, job2.destTableName))
//
//  }
//}
