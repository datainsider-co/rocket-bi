package datainsider.jobworker.service

import com.amazonaws.ClientConfiguration
import com.amazonaws.auth.{AWSStaticCredentialsProvider, BasicAWSCredentials}
import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column._
import datainsider.client.module.{MockSchemaClientModule, SchemaClientModule}
import datainsider.client.service.{MockSchemaClientService, SchemaClientService}
import datainsider.jobworker.client.NativeJdbcClient
import datainsider.jobworker.domain._
import datainsider.jobworker.module.TestModule
import datainsider.jobworker.service.worker.AmazonS3WorkerV2
import datainsider.jobworker.util.ZConfig
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

class AmazonS3WorkerV2Test2 extends IntegrationTest {
  val accessKey = "AKIA5JD4K3BU433CH3R3"
  val secretKey = "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"
  val region = "ap-southeast-1"
  val bucketName = "selly-adjust"

  val orgId = 1
  val sourceId = 1
  val jobId = 1

  val dataSource: AmazonS3Source = AmazonS3Source(
    orgId = orgId,
    id = sourceId,
    displayName = "amazon s3 source",
    creatorId = "root",
    lastModify = 0,
    awsAccessKeyId = accessKey,
    awsSecretAccessKey = secretKey,
    region = region
  )

  val clientConfiguration = new ClientConfiguration()
  clientConfiguration.setConnectionTimeout(600000)
  clientConfiguration.setConnectionTTL(3600 * 1000)
  val credential = new BasicAWSCredentials(dataSource.awsAccessKeyId, dataSource.awsSecretAccessKey)

  val s3 = AmazonS3ClientBuilder
    .standard()
    .withCredentials(new AWSStaticCredentialsProvider(credential))
    .withRegion(dataSource.region)
    .withClientConfiguration(clientConfiguration)
    .build()

  val jdbcUrl: String = ZConfig.getString("database_test.clickhouse.url")
  val username: String = ZConfig.getString("database_test.clickhouse.username")
  val password: String = ZConfig.getString("database_test.clickhouse.password")
  val clickhouseClient: NativeJdbcClient = NativeJdbcClient(jdbcUrl, username, password)

  override protected def injector: Injector = TestInjector(TestModule, SchemaClientModule).newInstance()
  val schemaService: SchemaClientService = injector.instance[SchemaClientService]
  val ssdbClient: SSDB = injector.instance[SSDB]
  val ssdbKVS: SsdbKVS[Long, Boolean] = SsdbKVS[Long, Boolean]("test_worker", ssdbClient)
  ssdbKVS.add(jobId, true).synchronized()

  val destDatabaseName: String = "org1_test"
  val destTableName: String = "selly_adjust2"

  val job: AmazonS3Job = AmazonS3Job(
    orgId = orgId,
    jobId = jobId,
    displayName = "test s3 job",
    sourceId = sourceId,
    lastSuccessfulSync = 0,
    syncIntervalInMn = 60,
    lastSyncStatus = JobStatus.Init,
    currentSyncStatus = JobStatus.Init,
    destDatabaseName = destDatabaseName,
    destTableName = destTableName,
    destinations = Seq(DataDestination.Clickhouse),
    bucketName = bucketName,
    fileConfig = CsvConfig(fileExtensions = Seq("csv")),
    folderPath = "gmxlmf61haf4_2022-03-26T230000_2a62ef950503dccd116080304ddad7a2_c3575d",
    incrementalTime = 1646096400000L
  )

  override def beforeAll(): Unit = {
    super.beforeAll()
  }

  override def afterAll(): Unit = {
//    clickhouseClient.executeUpdate(s"drop table $destDatabaseName.$destTableName")
    super.afterAll()
  }

  test("test amazon s3") {

    val baseProgress =
      AmazonS3Progress(
        job.orgId,
        1,
        job.jobId,
        System.currentTimeMillis(),
        JobStatus.Syncing,
        totalSyncRecord = 0,
        System.currentTimeMillis(),
        job.incrementalTime
      )

    val t1 = System.currentTimeMillis()

    val worker = new AmazonS3WorkerV2(dataSource, schemaService, ssdbKVS, s3Client = s3, batchSize = 1000)
    val report: JobProgress = worker.sync(job, 1, onProgress, baseProgress)
    assert(report.jobStatus.equals(JobStatus.Synced))

    println(s"${this.getClass.getSimpleName}::sync elapse time: ${System.currentTimeMillis() - t1}")

    val query = s"select count(*) from `$destDatabaseName`.`$destTableName`"
    val total: Long =
      clickhouseClient.executeQuery(query)(rs => {
        if (rs.next()) {
          rs.getLong(1)
        } else {
          0
        }
      })

    assert(total > 0)
  }

  def onProgress(progress: JobProgress): Future[Unit] =
    Future {
      println(progress)
    }

  def ensureDestinationTable(tableSchema: TableSchema): Unit = {
    val createDatabaseQuery = s"create database if not exists ${tableSchema.dbName}"
    clickhouseClient.executeUpdate(createDatabaseQuery)
    val createColumnDDL = tableSchema.columns
      .map(column => {
        s"`${column.name}` ${convertColumnType(column)}"
      })
      .mkString(",")

    val createTableQuery =
      s"""
         |create table if not exists ${tableSchema.dbName}.${tableSchema.name} (
         |$createColumnDDL
         |) ENGINE = MergeTree() ORDER BY tuple()
         |""".stripMargin
    clickhouseClient.executeUpdate(createTableQuery)
  }

  private def convertColumnType(column: Column): String = {
    val dataType = column match {
      case _: BoolColumn     => "UInt8"
      case _: Int8Column     => "Int8"
      case _: Int16Column    => "Int16"
      case _: Int32Column    => "Int32"
      case _: Int64Column    => "Int64"
      case _: UInt8Column    => "UInt8"
      case _: UInt16Column   => "UInt16"
      case _: UInt32Column   => "UInt32"
      case _: UInt64Column   => "UInt64"
      case _: FloatColumn    => "Float32"
      case _: DoubleColumn   => "Float64"
      case _: StringColumn   => "String"
      case _: DateColumn     => "Date"
      case _: DateTimeColumn => "Datetime"
    }

    if (column.isNullable) {
      s"Nullable($dataType)"
    } else {
      dataType
    }
  }
}
