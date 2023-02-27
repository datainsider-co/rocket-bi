package datainsider.jobscheduler.service

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Await
import datainsider.client.domain.scheduler.{ScheduleHourly, ScheduleMinutely, ScheduleOnce}
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.{Int32Column, StringColumn}
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.Ids.{JobId, SourceId}
import datainsider.jobscheduler.domain._
import datainsider.jobscheduler.domain.job._
import datainsider.jobscheduler.domain.request.{PaginationRequest, PaginationResponse, UpdateJobRequest}
import datainsider.jobscheduler.domain.response.JobInfo
import datainsider.jobscheduler.module.TestModule
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.util.Implicits.FutureEnhance
import datainsider.lakescheduler.module.LakeTestModule
import org.scalatest.BeforeAndAfterAll

class JobServiceTest extends IntegrationTest with BeforeAndAfterAll {

  override protected val injector: Injector =
    TestInjector(TestModule, LakeTestModule, MockSchemaClientModule, MockCaasClientModule).newInstance()
  val jobService: JobService = injector.instance[JobService]
  val sourceService: DataSourceService = injector.instance[DataSourceService]
  var sourceId: SourceId = 0
  var mongoSourceId: SourceId = 0
  var amazonS3SourceId: SourceId = 0
  override def beforeAll(): Unit = {
    Await.result(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
    Await.result(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())

    val source: DataSource =
      JdbcSource(
        1,
        1,
        "new_data_source",
        DatabaseType.MySql,
        "jdbc:mysql://localhost:3306",
        "root",
        "di@123",
        "root",
        System.currentTimeMillis()
      )

    sourceId = Await.result(sourceService.create(1, "root", source)).get.getId
    val mongoDbSource = MongoSource(
      orgId = 1,
      id = 1,
      displayName = "mongo",
      host = "localhost",
      port = Some("12707"),
      username = "hau",
      password = "123456",
      creatorId = "root",
      lastModify = System.currentTimeMillis()
    )
    mongoSourceId = Await.result(sourceService.create(1, "root", mongoDbSource)).get.getId

    val amazonS3Source = AmazonS3Source(
      orgId = 1,
      id = 1,
      displayName = "amazon s3 source",
      creatorId = "tester",
      lastModify = System.currentTimeMillis(),
      awsAccessKeyId = "s3_id",
      awsSecretAccessKey = "s3_key",
      region = "us-east-1"
    )
    amazonS3SourceId = Await.result(sourceService.create(1, "root", amazonS3Source)).get.getId
  }

  override def afterAll(): Unit = {
    Await.result(sourceService.delete(1, sourceId))
    Await.result(sourceService.delete(1, mongoSourceId))
  }

  var jobId: JobId = 0
  test("create job") {
    val job = JdbcJob(
      orgId = 1,
      displayName = "sad",
      jobType = JobType.Jdbc,
      sourceId = sourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "1001_database1",
      tableName = "transaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      destinations = Seq("Clickhouse"),
      incrementalColumn = None,
      queryStatement = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      scheduleTime = ScheduleMinutely(10)
    )
    val jobResp: JobInfo = Await.result(jobService.create(1, "", job))
    assert(jobResp != null)
    jobId = jobResp.job.jobId
  }

  test("test get job") {
    val jobResp: JobInfo = Await.result(jobService.get(1, jobId))
    assert(jobResp != null)
    println(jobResp)
  }

  test("test get jobs") {
    val jobsResp: PaginationResponse[JobInfo] = jobService.list(1, PaginationRequest(0, 10, request = null)).sync()
    assert(jobsResp.data.nonEmpty)
    jobsResp.data.foreach(println)
  }

  test("test update job") {
    val job = JdbcJob(
      orgId = 1,
      jobId = jobId,
      displayName = "sad",
      jobType = JobType.Jdbc,
      sourceId = sourceId,
      lastSuccessfulSync = 1000,
      syncIntervalInMn = 1000,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "1001_database1",
      tableName = "transaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      destinations = Seq("Clickhouse"),
      incrementalColumn = None,
      queryStatement = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      scheduleTime = ScheduleHourly(1000)
    )
    val updateReq = UpdateJobRequest(id = jobId, job = job, request = null)
    assert(jobService.update(1, updateReq).sync())
    val updatedJob: JobInfo = jobService.get(1, jobId).sync()
    assert(job.scheduleTime.equals(updatedJob.job.scheduleTime))
  }

  /*var sourceId: SourceId = 0
  test("test create") {
    val request = CreateJdbcSourceRequest(
      "test",
      DatabaseType.Oracle,
      "Oracle-db-test.cp163tfqt4gc.ap-southeast-1.rds.amazonaws.com",
      "1521/ORCL",
      "admin",
      "datainsider"
    )
    val result = dataSourceService.create(request).sync()
    id = result.getId
    assert(id != 0)
  }

  test("test preview") {
    val req = CreateJdbcJobRequest(dataSourceId = sourceId, databaseName = "test", tableName = "person")
    val result = jobService.preview(req, 0, 10)
    println(result)
    assert(result != null)
  }

  test("test preview fail") {
    val req = CreateJdbcJobRequest(dataSourceId = sourceId, databaseName = "wrong_test", tableName = "person")
    val result = jobService.preview(req, 0, 10)
    assert(result != null)
  }*/

  var mongoJobId: JobId = 0
  test("create mongodb job") {
    val job = MongoJob(
      orgId = 1,
      jobId = -1,
      displayName = "sad",
      jobType = JobType.MongoDb,
      sourceId = mongoSourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "1001_database1",
      tableName = "transaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      incrementalColumn = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      scheduleTime = ScheduleMinutely(10),
      destinations = Seq.empty
    )
    val jobResp: JobInfo = Await.result(jobService.create(1, "", job))
    assert(jobResp != null)
    mongoJobId = jobResp.job.jobId
  }

  test("test update mongodb job") {
    val job = MongoJob(
      orgId = 1,
      jobId = mongoJobId,
      displayName = "updated",
      jobType = JobType.MongoDb,
      sourceId = mongoSourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "1001_database1",
      tableName = "transaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      incrementalColumn = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      scheduleTime = ScheduleMinutely(10),
      destinations = Seq.empty
    )
    val updateReq = UpdateJobRequest(id = jobId, job = job, request = null)
    assert(jobService.update(1, updateReq).sync())
    val updatedJob: JobInfo = jobService.get(1, mongoJobId).sync()
    assert(job.displayName.equals(updatedJob.job.displayName))
  }

  test("create shopify job") {
    val job = ShopifyJob(
      orgId = 1,
      jobId = -1,
      displayName = "sad",
      jobType = JobType.Shopify,
      sourceId = mongoSourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      tableName = "OrderTransaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      lastSyncedValue = "0",
      scheduleTime = ScheduleMinutely(10),
      destinations = Seq.empty
    )
    val result: JobInfo = await(jobService.create(1, "root", job))
    assert(result != null)

    val savedJob: JobInfo = await(jobService.get(1, result.job.jobId))
    assert(savedJob.job.jobData == job.jobData)

    val isDeleted: Boolean = await(jobService.delete(1, result.job.jobId))
    assert(isDeleted)
  }

  test("test delete job") {
    assert(jobService.delete(1, jobId).sync())
    assert(jobService.delete(1, mongoJobId).sync())
  }

  test("test create multi jdbc job") {
    val job = JdbcJob(
      orgId = 1,
      displayName = "sad",
      jobType = JobType.Jdbc,
      sourceId = sourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "1001_database1",
      tableName = "transaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      destinations = Seq("Clickhouse"),
      incrementalColumn = None,
      queryStatement = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      scheduleTime = ScheduleOnce(1653050126252L)
    )
    val tableNames = Seq("tbl1", "tbl2", "tbl3", "tbl4")
    val result = jobService
      .createMultiJob(
        orgId = job.orgId,
        creatorId = "tester",
        sampleJob = job,
        tableNames = tableNames
      )
      .sync()
    assert(result)
    val jobsInfo = jobService.list(job.orgId, PaginationRequest(from = 0, size = 20, request = null)).sync()
    jobsInfo.data.foreach(jobInfo => {
      if (tableNames.contains(jobInfo.job.destTableName)) {
        val actualJob: JdbcJob = jobInfo.job.asInstanceOf[JdbcJob]
        println(actualJob)
        assert(tableNames.contains(actualJob.tableName))
        assert(tableNames.contains(actualJob.destTableName))
        assert(job.tableName != actualJob.tableName)
        assert(actualJob.nextRunTime == TimeUtils.calculateNextRunTime(job.scheduleTime, None))
        jobService.delete(job.orgId, jobId)
      }
    })
  }

  test("test create multi mongodb job") {
    val job = MongoJob(
      orgId = 1,
      jobId = -1,
      displayName = "sad",
      jobType = JobType.MongoDb,
      sourceId = mongoSourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "1001_database1",
      tableName = "transaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      incrementalColumn = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      scheduleTime = ScheduleMinutely(10),
      destinations = Seq.empty
    )
    val tableNames = Seq("mongodb_tbl1", "mongodb_tbl2", "mongodb_tbl3", "mongodb_tbl4")
    val result = jobService
      .createMultiJob(
        orgId = job.orgId,
        creatorId = "tester",
        sampleJob = job,
        tableNames = tableNames
      )
      .sync()
    assert(result)
    val jobsInfo = jobService.list(job.orgId, PaginationRequest(from = 0, size = 20, request = null)).sync()
    jobsInfo.data.foreach(jobInfo => {
      if (tableNames.contains(jobInfo.job.destTableName)) {
        val actualJob: MongoJob = jobInfo.job.asInstanceOf[MongoJob]
        println(actualJob)
        assert(tableNames.contains(actualJob.tableName))
        assert(tableNames.contains(actualJob.destTableName))
        assert(job.tableName != actualJob.tableName)
        assert(actualJob.nextRunTime == TimeUtils.calculateNextRunTime(job.scheduleTime, None))
        jobService.delete(job.orgId, jobId)
      }
    })
  }

  test("test create multi generic jdbc job") {
    val job = GenericJdbcJob(
      orgId = 1,
      displayName = "sad",
      jobType = JobType.GenericJdbc,
      sourceId = sourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      databaseName = "1001_database1",
      tableName = "transaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      destinations = Seq("Clickhouse"),
      incrementalColumn = None,
      queryStatement = None,
      lastSyncedValue = "0",
      maxFetchSize = 1000,
      scheduleTime = ScheduleMinutely(10)
    )
    val tableNames = Seq("generic_jdbc_tbl1", "generic_jdbc_tbl2", "generic_jdbc_tbl3", "generic_jdbc_tbl4")
    val result = jobService
      .createMultiJob(
        orgId = job.orgId,
        creatorId = "tester",
        sampleJob = job,
        tableNames = tableNames
      )
      .sync()
    assert(result)
    val jobsInfo = jobService.list(job.orgId, PaginationRequest(from = 0, size = 20, request = null)).sync()
    jobsInfo.data.foreach(jobInfo => {
      if (tableNames.contains(jobInfo.job.destTableName)) {
        val actualJob: GenericJdbcJob = jobInfo.job.asInstanceOf[GenericJdbcJob]
        println(actualJob)
        assert(tableNames.contains(actualJob.tableName))
        assert(tableNames.contains(actualJob.destTableName))
        assert(job.tableName != actualJob.tableName)
        assert(actualJob.nextRunTime == TimeUtils.calculateNextRunTime(job.scheduleTime, None))
        jobService.delete(job.orgId, jobId)
      }
    })
  }

  test("test create multi bigquery storage job") {
    val job = BigQueryStorageJob(
      orgId = 1,
      jobId = 1,
      displayName = "sad",
      jobType = JobType.Bigquery,
      sourceId = sourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      projectName = "bigquery",
      datasetName = "1001_database1",
      tableName = "transaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      destinations = Seq("Clickhouse"),
      incrementalColumn = None,
      lastSyncedValue = "0",
      scheduleTime = ScheduleMinutely(10),
      selectedColumns = Seq(),
      rowRestrictions = ""
    )
    val tableNames = Seq("bigquery_tbl1", "bigquery_tbl2", "bigquery_tbl3", "bigquery_tbl4")
    val result = jobService
      .createMultiJob(
        orgId = job.orgId,
        creatorId = "tester",
        sampleJob = job,
        tableNames = tableNames
      )
      .sync()
    assert(result)
    val jobsInfo = jobService.list(job.orgId, PaginationRequest(from = 0, size = 20, request = null)).sync()
    jobsInfo.data.foreach(jobInfo => {
      if (tableNames.contains(jobInfo.job.destTableName)) {
        val actualJob: BigQueryStorageJob = jobInfo.job.asInstanceOf[BigQueryStorageJob]
        println(actualJob)
        assert(tableNames.contains(actualJob.tableName))
        assert(tableNames.contains(actualJob.destTableName))
        assert(job.tableName != actualJob.tableName)
        assert(actualJob.nextRunTime == TimeUtils.calculateNextRunTime(job.scheduleTime, None))
        jobService.delete(job.orgId, jobId)
      }
    })
  }

  test("test create multi shopify job") {
    val job = ShopifyJob(
      orgId = 1,
      jobId = -1,
      displayName = "sad",
      jobType = JobType.Shopify,
      sourceId = mongoSourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 10,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      tableName = "OrderTransaction",
      destDatabaseName = "1001_database1",
      destTableName = "transaction",
      lastSyncedValue = "0",
      scheduleTime = ScheduleMinutely(10),
      destinations = Seq.empty
    )
    val tableNames: Set[String] = Seq("OrderTransaction", "Order", "OrderRisk", "Article").toSet
    val isCreateSuccess: Boolean = await(
      jobService
        .createMultiJob(
          orgId = job.orgId,
          creatorId = "tester",
          sampleJob = job,
          tableNames = tableNames.toSeq
        )
    )
    assert(isCreateSuccess)
    val pageResponse: PaginationResponse[JobInfo] =
      await(jobService.list(job.orgId, PaginationRequest(from = 0, size = 20, request = null)))
    pageResponse.data.foreach(jobInfo => {
      if (tableNames.contains(jobInfo.job.destTableName)) {
        assert(jobInfo.job.isInstanceOf[ShopifyJob])
        val actualJob: ShopifyJob = jobInfo.job.asInstanceOf[ShopifyJob]
        assert(tableNames.contains(actualJob.tableName))
        assert(actualJob.nextRunTime == TimeUtils.calculateNextRunTime(job.scheduleTime, None))
        val isDeleted: Boolean = await(jobService.delete(job.orgId, jobId))
        assert(isDeleted)
      }
    })
  }

  var amazonS3JobId: JobId = 0
  test("test create amazon s3 job") {
    val job = AmazonS3Job(
      orgId = 1,
      jobId = -1,
      displayName = "amazon s3 job",
      jobType = JobType.S3,
      creatorId = "root",
      lastModified = 0,
      syncMode = SyncMode.FullSync,
      sourceId = amazonS3SourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 0,
      nextRunTime = 0,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      scheduleTime = ScheduleOnce(startTime = 0),
      destDatabaseName = "test_db",
      destTableName = "test_tbl",
      destinations = Seq("clickhouse"),
      bucketName = "s3_bucket",
      fileConfig = CsvConfig(),
      incrementalTime = 0,
      tableSchema = Some(
        TableSchema(
          "name",
          "dbName",
          0L,
          "displayName",
          columns = Seq(StringColumn("name", "name"), Int32Column("age", "age"))
        )
      )
    )

    val result = jobService.create(job.orgId, job.creatorId, job).sync()
    amazonS3JobId = result.job.jobId
    assert(
      result.job
        .asInstanceOf[AmazonS3Job]
        .copy(lastModified = 0, tableSchema = None)
        .equals(job.copy(jobId = amazonS3JobId, tableSchema = None))
    )
    assert(result.job.asInstanceOf[AmazonS3Job].tableSchema.isDefined)
  }

  test("test get amazon s3 job") {
    val expectedJob = AmazonS3Job(
      orgId = 1,
      jobId = amazonS3JobId,
      displayName = "amazon s3 job",
      jobType = JobType.S3,
      creatorId = "root",
      lastModified = 0,
      syncMode = SyncMode.FullSync,
      sourceId = amazonS3SourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 0,
      nextRunTime = 0,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      scheduleTime = ScheduleOnce(startTime = 0),
      destDatabaseName = "test_db",
      destTableName = "test_tbl",
      destinations = Seq("clickhouse"),
      bucketName = "s3_bucket",
      fileConfig = CsvConfig(),
      incrementalTime = 0,
      tableSchema = Some(
        TableSchema(
          "name",
          "dbName",
          0L,
          "displayName",
          columns = Seq(StringColumn("name", "name"), Int32Column("age", "age"))
        )
      )
    )
    val result = jobService.get(1, amazonS3JobId).sync()
    assert(
      result.job
        .asInstanceOf[AmazonS3Job]
        .copy(lastModified = 0, tableSchema = None)
        .equals(expectedJob.copy(tableSchema = None))
    )
    assert(result.job.asInstanceOf[AmazonS3Job].tableSchema.isDefined)
  }

  test("test update amazon s3 job") {
    val job = AmazonS3Job(
      orgId = 1,
      jobId = amazonS3JobId,
      displayName = "amazon s3 job updated",
      jobType = JobType.S3,
      creatorId = "root",
      lastModified = 0,
      syncMode = SyncMode.FullSync,
      sourceId = amazonS3SourceId,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 0,
      nextRunTime = 0,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      scheduleTime = ScheduleOnce(startTime = 0),
      destDatabaseName = "test_db",
      destTableName = "test_tbl",
      destinations = Seq("clickhouse"),
      bucketName = "s3_bucket",
      fileConfig = CsvConfig(),
      incrementalTime = 0
    )
    val result: Boolean =
      jobService.update(job.orgId, UpdateJobRequest(id = job.jobId, job = job, request = null)).sync()
    assert(result)

    val updatedJob: Job = jobService.get(1, amazonS3JobId).sync().job
    assert(updatedJob.asInstanceOf[AmazonS3Job].copy(lastModified = 0).equals(job))
  }

  test("test delete amazon s3 job") {
    val result = jobService.delete(1, amazonS3JobId).sync()
    assert(result)
  }

  var googleAdsJobId: JobId = 0
  test("test create google ads job") {
    val job = GoogleAdsJob(
      orgId = 1,
      jobId = -1,
      displayName = "google ads job",
      jobType = JobType.GoogleAds,
      creatorId = "root",
      lastModified = 0,
      syncMode = SyncMode.FullSync,
      sourceId = -1,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 0,
      nextRunTime = 0,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      scheduleTime = ScheduleOnce(startTime = 0),
      destDatabaseName = "test_db",
      destTableName = "test_tbl",
      destinations = Seq("clickhouse"),
      customerId = "123456",
      resourceName = "ad_group",
      incrementalColumn = Some("ad_group.id"),
      lastSyncedValue = "0",
      startDate = None
    )

    val result = jobService.create(job.orgId, job.creatorId, job).sync()
    googleAdsJobId = result.job.jobId
    assert(
      result.job
        .asInstanceOf[GoogleAdsJob]
        .copy(lastModified = 0)
        .equals(job.copy(jobId = googleAdsJobId))
    )
  }

  test("test get google ads job") {
    val expectedJob = GoogleAdsJob(
      orgId = 1,
      jobId = googleAdsJobId,
      displayName = "google ads job",
      jobType = JobType.GoogleAds,
      creatorId = "root",
      lastModified = 0,
      syncMode = SyncMode.FullSync,
      sourceId = -1,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 0,
      nextRunTime = 0,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      scheduleTime = ScheduleOnce(startTime = 0),
      destDatabaseName = "test_db",
      destTableName = "test_tbl",
      destinations = Seq("clickhouse"),
      customerId = "123456",
      resourceName = "ad_group",
      incrementalColumn = Some("ad_group.id"),
      lastSyncedValue = "0",
      startDate = None
    )
    val result = jobService.get(1, googleAdsJobId).sync()

  }

  test("test update google ads job") {
    val job = GoogleAdsJob(
      orgId = 1,
      jobId = googleAdsJobId,
      displayName = "google ads job updated",
      jobType = JobType.GoogleAds,
      creatorId = "root",
      lastModified = 0,
      syncMode = SyncMode.FullSync,
      sourceId = -1,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 0,
      nextRunTime = 0,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      scheduleTime = ScheduleOnce(startTime = 0),
      destDatabaseName = "test_db",
      destTableName = "test_tbl",
      destinations = Seq("clickhouse"),
      customerId = "123456",
      resourceName = "ad_group",
      incrementalColumn = Some("ad_group.id"),
      lastSyncedValue = "0",
      startDate = Some("2019-01-13")
    )
    val result: Boolean =
      jobService.update(job.orgId, UpdateJobRequest(id = job.jobId, job = job, request = null)).sync()
    assert(result)

    val updatedJob: Job = jobService.get(1, googleAdsJobId).sync().job
    assert(updatedJob.asInstanceOf[GoogleAdsJob].copy(lastModified = 0).equals(job))
  }

  test("test delete google ads job") {
    val result = jobService.delete(1, googleAdsJobId).sync()
    assert(result)
  }

  test("test create multi google ads job") {
    val job = GoogleAdsJob(
      orgId = 1,
      jobId = googleAdsJobId,
      displayName = "google ads job",
      jobType = JobType.GoogleAds,
      creatorId = "root",
      lastModified = 0,
      syncMode = SyncMode.FullSync,
      sourceId = -1,
      lastSuccessfulSync = 0,
      syncIntervalInMn = 0,
      nextRunTime = 0,
      lastSyncStatus = JobStatus.Init,
      currentSyncStatus = JobStatus.Init,
      scheduleTime = ScheduleOnce(startTime = 0),
      destDatabaseName = "test_db",
      destTableName = "test_tbl",
      destinations = Seq("clickhouse"),
      customerId = "123456",
      resourceName = "resource",
      incrementalColumn = Some("ad_group.id"),
      lastSyncedValue = "",
      startDate = Some("2019-01-11")
    )
    val tableNames = Seq("campaign", "ad_group", "customer", "change_event")
    val result = jobService
      .createMultiJob(
        orgId = job.orgId,
        creatorId = "tester",
        sampleJob = job,
        tableNames = tableNames
      )
      .sync()
    assert(result)
    val jobsInfo = jobService.list(job.orgId, PaginationRequest(from = 0, size = 20, request = null)).sync()
    jobsInfo.data.foreach(jobInfo => {
      if (tableNames.contains(jobInfo.job.destTableName)) {
        val actualJob: GoogleAdsJob = jobInfo.job.asInstanceOf[GoogleAdsJob]
        assert(tableNames.contains(actualJob.resourceName))
        assert(tableNames.contains(actualJob.destTableName))
        assert(job.resourceName != actualJob.resourceName)
        assert(actualJob.nextRunTime == TimeUtils.calculateNextRunTime(job.scheduleTime, None))
        jobService.delete(job.orgId, jobId)
      }
    })
  }
}
