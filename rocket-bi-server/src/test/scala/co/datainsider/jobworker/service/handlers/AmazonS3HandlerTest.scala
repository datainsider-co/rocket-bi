//package co.datainsider.jobworker.service.handlers
//
//import co.datainsider.jobworker.domain.job.AmazonS3Job
//import co.datainsider.jobworker.domain.source.AmazonS3Source
//import co.datainsider.jobworker.domain.{CsvConfig, DataDestination, JobStatus}
//import co.datainsider.jobworker.service.handler.{AmazonS3MetadataHandler, SourceMetadataHandler}
//import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
//import com.twitter.inject.Test
//import datainsider.client.domain.Implicits.FutureEnhanceLike
//import co.datainsider.schema.domain.TableSchema
//import co.datainsider.schema.domain.column.{BoolColumn, DateTimeColumn, Int32Column, StringColumn}
//import org.scalatest.BeforeAndAfterAll
//import org.testcontainers.containers.localstack.LocalStackContainer
//import org.testcontainers.containers.localstack.LocalStackContainer.Service
//import org.testcontainers.utility.DockerImageName
//
//import java.io.File
//
//class AmazonS3HandlerTest extends Test with BeforeAndAfterAll {
//  val localstackImage: DockerImageName = DockerImageName.parse("localstack/localstack:0.14.2")
//  val localstack: LocalStackContainer = new LocalStackContainer(localstackImage)
//  localstack.withServices(Service.S3)
//  localstack.start()
//
//  val bucketName: String = "s3-test"
//  val destDatabaseName: String = "s3_database"
//  val destTableName: String = "s3_table"
//
//  val client: AmazonS3 = AmazonS3ClientBuilder
//    .standard()
//    .withEndpointConfiguration(localstack.getEndpointConfiguration(Service.S3))
//    .withCredentials(localstack.getDefaultCredentialsProvider)
//    .build()
//
//  val dataSource: AmazonS3Source = AmazonS3Source(
//    orgId = 0L,
//    id = 1,
//    displayName = "amazon s3 source",
//    creatorId = "root",
//    lastModify = 0,
//    awsAccessKeyId = "key",
//    awsSecretAccessKey = "password",
//    region = "us-east-1"
//  )
//
//  val job: AmazonS3Job = AmazonS3Job(
//    orgId = 0,
//    jobId = 1,
//    displayName = "amazon s3 job",
//    sourceId = 1,
//    lastSuccessfulSync = 0,
//    syncIntervalInMn = 60,
//    lastSyncStatus = JobStatus.Init,
//    currentSyncStatus = JobStatus.Init,
//    destDatabaseName = destDatabaseName,
//    destTableName = destTableName,
//    destinations = Seq(DataDestination.Clickhouse),
//    bucketName = bucketName,
//    fileConfig = CsvConfig(fileExtensions = Seq("csv"), includeHeader = false),
//    incrementalTime = 0
//  )
//
//  override def beforeAll(): Unit = {
//    client.createBucket(bucketName)
//    client.putObject(bucketName, "products.csv", new File(getClass.getClassLoader.getResource("datasets/products.csv").getFile))
//    super.beforeAll()
//  }
//
//  test("test connection") {
//    val metadataService: SourceMetadataHandler = new AmazonS3MetadataHandler(client)
//    assert(metadataService.testConnection().syncGet())
//  }
//
//  test("test list bucket") {
//    val metadataService: SourceMetadataHandler = new AmazonS3MetadataHandler(client)
//    val buckets: Seq[String] = metadataService.listDatabases().syncGet()
//    assert(buckets.contains(bucketName))
//  }
//
//  test("test preview") {
//    val metadataService: AmazonS3MetadataHandler = new AmazonS3MetadataHandler(client)
//    val expectedTableSchema: TableSchema = TableSchema(
//      name = "",
//      dbName = "",
//      organizationId = 0,
//      displayName = "",
//      columns = Seq(
//        Int32Column(name = "_c0", displayName = "_c0", isNullable = true),
//        StringColumn(name = "_c1", displayName = "_c1", isNullable = true),
//        Int32Column(name = "_c2", displayName = "_c2", isNullable = true),
//        StringColumn(name = "_c3", displayName = "_c3", isNullable = true),
//        DateTimeColumn(name = "_c4", displayName = "_c4", isNullable = true),
//        StringColumn(name = "_c5", displayName = "_c5", isNullable = true),
//        BoolColumn(name = "_c6", displayName = "_c6", isNullable = true)
//      )
//    )
//    val expectedData: String =
//      """1,Hu Tieu My Tho,25,Co Ba Sai Gon,2020-05-16 00:00:00.0,Viet Nam,true
//        |2,Iphone,999,Apple,1999-06-10 00:00:00.0,Viet Nam,true
//        |3,MacBook13,1999,Apple,2020-05-16 00:00:00.0,US,false
//        |4,Banh Mi Sai Gon,75,Co Ba Sai Gon,1999-06-10 00:00:00.0,Viet Nam,true
//        |5,Banh Mi Sai Gon,35,Co Ba Sai Gon,2001-08-10 00:00:00.0,Viet Nam,true
//        |6,Banh Mi Sai Gon,40,Co Ba Ha Noi,2001-09-10 00:00:00.0,Viet Nam,false
//        |7,Banh Mi Sai Gon,55,Co Ba Sai Gon,2001-08-10 00:00:00.0,Viet Nam,false
//        |8,Banh Mi Sai Gon,160,Co Ba Ha Noi,2001-09-10 00:00:00.0,Viet Nam,false
//        |9,Iphone,950,CellphoneS,2000-01-01 00:00:00.0,US,true
//        |10,Iphone,1050,China,2010-01-01 00:00:00.0,China,true
//        |11,Iphone,90,China,2020-02-02 00:00:00.0,China,true""".stripMargin
//
//    val previewResponse = metadataService.preview(s3Job = job).syncGet()
//    previewResponse.tableSchema.columns.foreach(println)
//    previewResponse.tableSchema.columns.foreach(column => {
//      assert(expectedTableSchema.findColumn(column.name).nonEmpty)
//    })
//
//    val numLines = expectedData.split('\n').size
//    assert(previewResponse.records.size == numLines)
//  }
//}
