package datainsider.jobworker.service

import com.google.ads.googleads.lib.GoogleAdsClient
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.client.module.MockSchemaClientModule
import datainsider.client.service.{MockSchemaClientService, SchemaClientService}
import datainsider.jobworker.client.NativeJdbcClient
import datainsider.jobworker.domain._
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.worker.GoogleAdsWorker
import datainsider.jobworker.util.{ClickhouseDbTestUtils, ZConfig}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

class GoogleAdsWorkerTest() extends IntegrationTest {

  override protected def injector: Injector = TestInjector(TestModule, MockSchemaClientModule).newInstance()

  val destDatabaseName: String = "test_google_ads_db"
  val destTableName: String = "test_google_ads_tbl"
  val jdbcUrl: String = ZConfig.getString("database_test.clickhouse.url")
  val username: String = ZConfig.getString("database_test.clickhouse.username")
  val password: String = ZConfig.getString("database_test.clickhouse.password")
  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)
  override def beforeAll(): Unit = {
    dbTestUtils.createDatabase(destDatabaseName)
    dbTestUtils.createTable(tableSchema)
    super.beforeAll()
  }

  override def afterAll(): Unit = {
    dbTestUtils.dropDatabase(destDatabaseName)
    super.afterAll()
  }

  val job: GoogleAdsJob = GoogleAdsJob(
    orgId = 1,
    jobId = 1,
    jobType = JobType.GoogleAds,
    syncMode = SyncMode.FullSync,
    sourceId = 0,
    lastSuccessfulSync = System.currentTimeMillis(),
    syncIntervalInMn = 0,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Init,
    destDatabaseName = destDatabaseName,
    destTableName = destTableName,
    destinations = Seq(DataDestination.Clickhouse),
    customerId = "1927297165",
    resourceName = "campaign",
    incrementalColumn = None,
    lastSyncedValue = "",
    startDate = Some("2013-01-01"),
    query = None
  )
  val source: GoogleAdsSource = GoogleAdsSource(
    orgId = -1,
    id = 1,
    displayName = "test",
    creatorId = "tester",
    lastModify = 0,
    refreshToken =
      "1//04FE9U0ztiGiGCgYIARAAGAQSNwF-L9IrxOHc_czyT6VC58ocJ4Ga74ZhRawI3kUaS3uyOhmBr-vgRrasE8VXCYmL_vCGX_HLRxo"
  )
  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)
  ssdbKVS.add(1, true).synchronized()
  val googleAdsWorker: GoogleAdsWorker =
    new GoogleAdsWorker(source, schemaService = schemaService, ssdbKVS = ssdbKVS, batchSize = 1000)

  val client: GoogleAdsClient = googleAdsWorker.buildClient(source)
  val tableSchema: TableSchema = googleAdsWorker.getTableSchema(client, job)
  test("test google ads worker") {
    val report: JobProgress = googleAdsWorker.run(job, 1, onProgress)
    assert(report.jobStatus.equals(JobStatus.Synced))

    val clickhouseClient = NativeJdbcClient(jdbcUrl, username, password)
    val totalRecord: Long =
      clickhouseClient.executeQuery(s"select count(*) from $destDatabaseName.$destTableName")(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else {
          0
        }
      })
    println(totalRecord)
    assert(totalRecord >= 1)
  }

  test("test detect table schema from resource name") {
    val tableSchema = googleAdsWorker.getTableSchema(client, job)
    assert(tableSchema.name.equals(destTableName))
    assert(tableSchema.dbName.equals(destDatabaseName))
    assert(tableSchema.columns.nonEmpty)
    val expectedColumnName = "customer_user_access.user_id"
    val actualColumn: Option[Column] = tableSchema.columns.find(_.name.equals(expectedColumnName))
    assert(actualColumn.nonEmpty)
    assert(actualColumn.get.isInstanceOf[Int64Column])
  }

  def onProgress(progress: JobProgress): Future[Unit] = {
    Future.Unit
  }
}
