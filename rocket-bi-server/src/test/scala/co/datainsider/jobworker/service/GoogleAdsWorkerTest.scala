//package co.datainsider.jobworker.service
//
//import co.datainsider.bi.client.NativeJDbcClient
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.bi.util.ZConfig
//import co.datainsider.jobworker.domain._
//import co.datainsider.jobworker.domain.job.GoogleAdsJob
//import co.datainsider.jobworker.domain.source.GoogleAdsSource
//import co.datainsider.jobworker.module.JobWorkerTestModule
//import co.datainsider.jobworker.service.handler.GoogleResource
//import co.datainsider.jobworker.service.worker.GoogleAdsWorker
//import co.datainsider.jobworker.util.ClickhouseDbTestUtils
//import com.google.ads.googleads.lib.GoogleAdsClient
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import com.twitter.util.Future
//import co.datainsider.schema.domain.TableSchema
//import co.datainsider.schema.domain.column._
//import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
//import co.datainsider.schema.client.{MockSchemaClientService, SchemaClientService}
//import co.datainsider.schema.module.MockSchemaClientModule
//import com.google.inject.name.Names
//import education.x.commons.SsdbKVS
//import org.nutz.ssdb4j.spi.SSDB
//
//class GoogleAdsWorkerTest() extends IntegrationTest {
//
//  override protected def injector: Injector = TestInjector(JobWorkerTestModule, TestContainerModule, MockHadoopFileClientModule, MockLakeClientModule, MockSchemaClientModule).newInstance()
//
//  val destDatabaseName: String = "test_google_ads_db"
//  val destTableName: String = "test_google_ads_tbl"
//  val jdbcUrl: String = injector.instance[String](Names.named("clickhouse_jdbc_url"))
//  val username: String = ZConfig.getString("test_db.clickhouse.username")
//  val password: String = ZConfig.getString("test_db.clickhouse.password")
//  val dbTestUtils: ClickhouseDbTestUtils = new ClickhouseDbTestUtils(jdbcUrl, username, password)
//  override def beforeAll(): Unit = {
//    dbTestUtils.createDatabase(destDatabaseName)
//    dbTestUtils.createTable(tableSchema)
//    super.beforeAll()
//  }
//
//  override def afterAll(): Unit = {
//    dbTestUtils.dropDatabase(destDatabaseName)
//    super.afterAll()
//  }
//
//  val job: GoogleAdsJob = GoogleAdsJob(
//    orgId = 1,
//    jobId = 1,
//    jobType = JobType.GoogleAds,
//    syncMode = SyncMode.IncrementalSync,
//    sourceId = 0,
//    lastSuccessfulSync = System.currentTimeMillis(),
//    syncIntervalInMn = 0,
//    lastSyncStatus = JobStatus.Init,
//    currentSyncStatus = JobStatus.Init,
//    destDatabaseName = destDatabaseName,
//    destTableName = destTableName,
//    destinations = Seq(DataDestination.Clickhouse),
//    customerId = "1927297165",
//    resourceName = GoogleResource.AdGroupAd,
//    lastSyncedValue = "",
//    startDate = Some("2019-01-01")
//  )
//  val source: GoogleAdsSource = GoogleAdsSource(
//    orgId = -1,
//    id = 1,
//    displayName = "test",
//    creatorId = "tester",
//    lastModify = 0,
//    refreshToken =
//      "1//04FE9U0ztiGiGCgYIARAAGAQSNwF-L9IrxOHc_czyT6VC58ocJ4Ga74ZhRawI3kUaS3uyOhmBr-vgRrasE8VXCYmL_vCGX_HLRxo"
//  )
//  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
//  val ssdbClient: SSDB = injector.instance[SSDB]
//  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)
//  ssdbKVS.add(1, true).synchronized()
//  val googleAdsWorker: GoogleAdsWorker =
//    new GoogleAdsWorker(source, schemaService = schemaService, jobInQueue = ssdbKVS, batchSize = 1000)
//
//  val client: GoogleAdsClient = googleAdsWorker.buildClient(source)
//  val tableSchema: TableSchema = googleAdsWorker.getTableSchema(job)
//  test("test google ads worker") {
//    val report: JobProgress = googleAdsWorker.run(job, 1, onProgress)
//    assert(report.jobStatus.equals(JobStatus.Synced))
//  }
//
//  test("test detect table schema from resource name") {
//    val tableSchema = googleAdsWorker.getTableSchema(job)
//    assert(tableSchema.name.equals(destTableName))
//    assert(tableSchema.dbName.equals(destDatabaseName))
//    assert(tableSchema.columns.nonEmpty)
//    val expectedColumnName = "segments_device"
//    val actualColumn: Option[Column] = tableSchema.columns.find(_.name.equals(expectedColumnName))
//    assert(actualColumn.nonEmpty)
//    assert(actualColumn.get.isInstanceOf[StringColumn])
//  }
//
//  def onProgress(progress: JobProgress): Future[Unit] = Future {
//    println(s"onProgress ${progress}")
//  }
//}
