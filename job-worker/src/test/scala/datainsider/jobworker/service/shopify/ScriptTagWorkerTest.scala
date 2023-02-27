package datainsider.jobworker.service.shopify

import datainsider.client.domain.Implicits.ScalaFutureLike
import datainsider.jobworker.domain._
import datainsider.jobworker.repository.reader.shopify.ShopifyReader
import datainsider.jobworker.service.worker.ShopifyWorker

import scala.concurrent.ExecutionContext.Implicits.global

class ScriptTagWorkerTest extends ShopifyWorkerTest {

  val source = ShopifySource(12, 121217, "ShopifyWorker", apiUrl, accessToken, apiVersion)
  val job = ShopifyJob(
    orgId = 12,
    jobId = 12127,
    jobType = JobType.Shopify,
    syncMode = SyncMode.IncrementalSync,
    sourceId = 121217,
    lastSuccessfulSync = 0,
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Syncing,
    destDatabaseName = dbName,
    destTableName = "script_tag_table_test_1",
    destinations = Seq(DataDestination.Clickhouse),
    tableName = ShopifyTable.ScripTag,
    lastSyncedValue = ""
  )

  val job2 = ShopifyJob(
    orgId = 12,
    jobId = 12127,
    jobType = JobType.Shopify,
    syncMode = SyncMode.IncrementalSync,
    sourceId = 121217,
    lastSuccessfulSync = 0,
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Syncing,
    destDatabaseName = dbName,
    destTableName = "script_tag_table_test_2",
    destinations = Seq(DataDestination.Clickhouse),
    tableName = ShopifyTable.ScripTag,
    lastSyncedValue = "203840225507"
  )

  var lastSyncedValue = ""
  var lastSyncedRows = 0L

  private val reader = ShopifyReader(source, job.tableName)

  override protected def ensureTableSchema(): Unit = {
    val tableSchema = reader.getTableSchema(job.orgId, job.destDatabaseName, job.destTableName)
    dbTestUtils.createTable(tableSchema)

    val tableSchema2 = reader.getTableSchema(job2.orgId, job2.destDatabaseName, job2.destTableName)
    dbTestUtils.createTable(tableSchema2)
  }

  test("Incremental sync script tag") {

    val syncId = 12
    await(ssdbKVS.add(syncId, true).asTwitter)
    val worker = new ShopifyWorker(source, schemaService, kvs = ssdbKVS)
    var finishedProgress: ShopifyJobProgress = null
    try {
      finishedProgress = worker.run(job, syncId, reportJob);
      println(s"finished progress is ${finishedProgress}")
    } catch {
      case ex =>
        ex.printStackTrace()
        assert(false)
    }
    assert(finishedProgress.jobStatus === JobStatus.Synced)
    assert(finishedProgress.jobId === job.jobId)
    assert(finishedProgress.syncId === syncId)
    val isRunning: Boolean = await(ssdbKVS.get(syncId).asTwitter).getOrElse(false)
    assert(!isRunning)

    val totalRows = count(job.destDatabaseName, job.destTableName)
    println(s"current inserted rows: ${finishedProgress.totalSyncRecord}")
    println(s"actual total rows: ${totalRows}")
    assert(totalRows == finishedProgress.totalSyncRecord)
    lastSyncedRows = lastSyncedRows + finishedProgress.totalSyncRecord

    println(s"current latest id: ${finishedProgress.lastSyncedValue}")
    lastSyncedValue = String.valueOf(finishedProgress.lastSyncedValue)
    ensureTableCreated(reader.getTableSchema(job.orgId, job.destDatabaseName, job.destTableName))
  }

  test("Incremental sync script tag from latest id") {

    val syncId = 13
    await(ssdbKVS.add(syncId, true).asTwitter)
    val worker = new ShopifyWorker(source, schemaService, kvs = ssdbKVS)
    var finishedProgress: ShopifyJobProgress = null
    try {
      finishedProgress = worker.run(job.copy(lastSyncedValue = lastSyncedValue), syncId, reportJob);
      println(s"finished progress is ${finishedProgress}")
    } catch {
      case ex =>
        ex.printStackTrace()
        assert(false)
    }
    assert(finishedProgress.jobStatus === JobStatus.Synced)
    assert(finishedProgress.jobId === job.jobId)
    assert(finishedProgress.syncId === syncId)
    val isRunning: Boolean = await(ssdbKVS.get(syncId).asTwitter).getOrElse(false)
    assert(!isRunning)

    val totalRows = count(job.destDatabaseName, job.destTableName)
    println(s"current inserted rows: ${finishedProgress.totalSyncRecord}")
    println(s"actual total rows: ${totalRows}")
    assert(totalRows == lastSyncedRows)

    println(s"current latest id: ${finishedProgress.lastSyncedValue}")
    ensureTableCreated(reader.getTableSchema(job.orgId, job.destDatabaseName, job.destTableName))

  }

  test("Incremental sync script tag from 203840225507") {

    val syncId = 13
    await(ssdbKVS.add(syncId, true).asTwitter)
    val worker = new ShopifyWorker(source, schemaService, kvs = ssdbKVS)
    var finishedProgress: ShopifyJobProgress = null
    try {
      finishedProgress = worker.run(job2, syncId, reportJob);
      println(s"finished progress is ${finishedProgress}")
    } catch {
      case ex =>
        ex.printStackTrace()
        assert(false)
    }
    assert(finishedProgress.jobStatus === JobStatus.Synced)
    assert(finishedProgress.jobId === job2.jobId)
    assert(finishedProgress.syncId === syncId)
    val isRunning: Boolean = await(ssdbKVS.get(syncId).asTwitter).getOrElse(false)
    assert(!isRunning)

    val totalRows = count(job2.destDatabaseName, job2.destTableName)
    println(s"current inserted rows: ${finishedProgress.totalSyncRecord}")
    println(s"actual total rows: ${totalRows}")
    assert(totalRows == finishedProgress.totalSyncRecord)

    println(s"current latest id: ${finishedProgress.lastSyncedValue}")
    ensureTableCreated(reader.getTableSchema(job2.orgId, job2.destDatabaseName, job2.destTableName))
  }
}
