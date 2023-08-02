//package co.datainsider.jobworker.service
//
//import co.datainsider.bi.client.NativeJDbcClient
//import co.datainsider.bi.domain.{ClickhouseConnection, Connection}
//import co.datainsider.bi.engine.{ClientPool, Engine}
//import co.datainsider.bi.engine.clickhouse.ClickhouseEngine
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.bi.util.ZConfig
//import co.datainsider.jobworker
//import co.datainsider.jobworker.domain._
//import co.datainsider.jobworker.domain.job.AmazonS3Job
//import co.datainsider.jobworker.domain.source.AmazonS3Source
//import co.datainsider.jobworker.module.JobWorkerTestModule
//import co.datainsider.jobworker.service.worker.AmazonS3Worker
//import co.datainsider.schema.client.{MockSchemaClientService, SchemaClientService}
//import co.datainsider.schema.domain.TableSchema
//import co.datainsider.schema.domain.column._
//import co.datainsider.schema.module.MockSchemaClientModule
//import com.amazonaws.ClientConfiguration
//import com.amazonaws.auth.{AWSStaticCredentialsProvider, BasicAWSCredentials}
//import com.amazonaws.services.s3.AmazonS3ClientBuilder
//import com.google.inject.name.Names
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import com.twitter.util.Future
//import datainsider.client.domain.Implicits.ScalaFutureLike
//import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
//import education.x.commons.SsdbKVS
//import org.nutz.ssdb4j.spi.SSDB
//
//import scala.concurrent.ExecutionContext.Implicits.global
//
//class AmazonS3WorkerTest extends AbstractWorkerTest {
//
//  val accessKey = "AKIA5JD4K3BU433CH3R3"
//  val secretKey = "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"
//  val region = "ap-southeast-1"
//
//  val dataSource: AmazonS3Source = AmazonS3Source(
//    orgId = 0L,
//    id = 1,
//    displayName = "amazon s3 source",
//    creatorId = "root",
//    lastModify = 0,
//    awsAccessKeyId = accessKey,
//    awsSecretAccessKey = secretKey,
//    region = region
//  )
//
//  val clientConfiguration = new ClientConfiguration()
//  clientConfiguration.setConnectionTimeout(600000)
//  clientConfiguration.setConnectionTTL(3600 * 1000)
//  val credential = new BasicAWSCredentials(dataSource.awsAccessKeyId, dataSource.awsSecretAccessKey)
//
//  val s3 = AmazonS3ClientBuilder
//    .standard()
//    .withCredentials(new AWSStaticCredentialsProvider(credential))
//    .withRegion(dataSource.region)
//    .withClientConfiguration(clientConfiguration)
//    .build()
//
//  val jdbcUrl: String = injector.instance[String](Names.named("clickhouse_jdbc_url"))
//  val username: String = ZConfig.getString("test_db.clickhouse.username")
//  val password: String = ZConfig.getString("test_db.clickhouse.password")
//  val clickhouseClient: NativeJDbcClient = NativeJDbcClient(jdbcUrl, username, password)
//
//  val schemaService: SchemaClientService = injector.instance[MockSchemaClientService]
//  val ssdbClient: SSDB = injector.instance[SSDB]
//  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)
//  await(ssdbKVS.add(1, true).asTwitter)
//
//  val bucketName: String = "selly-adjust"
//  val destDatabaseName: String = "s3_database"
//  val destTableName: String = "s3_table"
//
//  val job: AmazonS3Job = jobworker.domain.job.AmazonS3Job(
//    orgId = 0,
//    jobId = 1,
//    displayName = "test s3 job",
//    sourceId = dataSource.id,
//    lastSuccessfulSync = 0,
//    syncIntervalInMn = 60,
//    lastSyncStatus = JobStatus.Init,
//    currentSyncStatus = JobStatus.Init,
//    destDatabaseName = destDatabaseName,
//    destTableName = destTableName,
//    destinations = Seq(DataDestination.Clickhouse),
//    bucketName = bucketName,
//    fileConfig = CsvConfig(fileExtensions = Seq("csv")),
//    folderPath = "date/",
//    incrementalTime = 1641000000000L
//  )
//
//  val destTableSchema: TableSchema = TableSchema(
//    name = destTableName,
//    dbName = destDatabaseName,
//    organizationId = 0,
//    displayName = destTableName,
//    columns = Seq(
//      Int32Column(name = "id", displayName = "id", isNullable = true),
//      StringColumn(name = "name", displayName = "name", isNullable = true),
//      Int32Column(name = "number", displayName = "number", isNullable = true),
//      StringColumn(name = "type", displayName = "type", isNullable = true),
//      DateTimeColumn(name = "datetime", displayName = "datetime", isNullable = true),
//      StringColumn(name = "country", displayName = "country", isNullable = true)
//    )
//  )
//
//  override def beforeAll(): Unit = {
//    ensureDestinationTable(destTableSchema)
//    super.beforeAll()
//  }
//
//  override def afterAll(): Unit = {
//    clickhouseClient.executeUpdate(s"drop table $destDatabaseName.$destTableName")
//    super.afterAll()
//  }
//
//  test("test amazon s3") {
////    val s3: AmazonS3 = AmazonS3ClientBuilder
////      .standard()
////      .withEndpointConfiguration(localstack.getEndpointConfiguration(Service.S3))
////      .withCredentials(localstack.getDefaultCredentialsProvider)
////      .build()
//
////    s3.createBucket(bucketName)
////    s3.putObject(bucketName, "products.csv", new File("./data/products.csv"))
//
//    val baseProgress =
//      AmazonS3Progress(
//        job.orgId,
//        1,
//        job.jobId,
//        System.currentTimeMillis(),
//        JobStatus.Syncing,
//        totalSyncRecord = 0,
//        System.currentTimeMillis(),
//        job.incrementalTime
//      )
//
//    val worker = new AmazonS3Worker(
//      source = dataSource,
//      schemaService = schemaService,
//      jobInQueue = ssdbKVS,
//      s3Client = s3,
//      batchSize = 1000,
//      engine = engine,
//      connection = connection
//    )
//    val report: JobProgress = worker.sync(destTableSchema, job, 1, onProgress, baseProgress)
//    assert(report.jobStatus.equals(JobStatus.Synced))
//
//    val query = s"select count(*) from `$destDatabaseName`.`$destTableName`"
//    val total: Long =
//      clickhouseClient.executeQuery(query)(rs => {
//        if (rs.next()) {
//          rs.getLong(1)
//        } else {
//          0
//        }
//      })
//
//    assert(total == 0)
//  }
//
//  def onProgress(progress: JobProgress): Future[Unit] = {
//    Future.Unit
//  }
//
//  def ensureDestinationTable(tableSchema: TableSchema): Unit = {
//    val createDatabaseQuery = s"create database if not exists ${tableSchema.dbName}"
//    clickhouseClient.executeUpdate(createDatabaseQuery)
//    val createColumnDDL = tableSchema.columns
//      .map(column => {
//        s"${column.name} ${convertColumnType(column)}"
//      })
//      .mkString(",")
//
//    val createTableQuery =
//      s"""
//         |create table if not exists ${tableSchema.dbName}.${tableSchema.name} (
//         |$createColumnDDL
//         |) ENGINE = MergeTree() ORDER BY tuple()
//         |""".stripMargin
//    clickhouseClient.executeUpdate(createTableQuery)
//  }
//
//  private def convertColumnType(column: Column): String = {
//    val dataType = column match {
//      case _: BoolColumn     => "UInt8"
//      case _: Int8Column     => "Int8"
//      case _: Int16Column    => "Int16"
//      case _: Int32Column    => "Int32"
//      case _: Int64Column    => "Int64"
//      case _: UInt8Column    => "UInt8"
//      case _: UInt16Column   => "UInt16"
//      case _: UInt32Column   => "UInt32"
//      case _: UInt64Column   => "UInt64"
//      case _: FloatColumn    => "Float32"
//      case _: DoubleColumn   => "Float64"
//      case _: StringColumn   => "String"
//      case _: DateColumn     => "Date"
//      case _: DateTimeColumn => "Datetime"
//    }
//
//    if (column.isNullable) {
//      s"Nullable($dataType)"
//    } else {
//      dataType
//    }
//  }
//}
