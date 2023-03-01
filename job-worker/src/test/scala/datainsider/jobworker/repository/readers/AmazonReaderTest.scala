//package datainsider.jobworker.repository.readers
//
//import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
//import datainsider.client.domain.schema.TableSchema
//import datainsider.client.domain.schema.column.{DateTimeColumn, Int32Column, StringColumn}
//import datainsider.jobworker.domain.{AmazonS3Job, CsvConfig, DataDestination, JobStatus}
//import datainsider.jobworker.repository.reader.CloudServiceReader
//import org.scalatest.{BeforeAndAfterAll, FunSuite}
//import org.testcontainers.containers.localstack.LocalStackContainer
//import org.testcontainers.containers.localstack.LocalStackContainer.Service
//import org.testcontainers.utility.DockerImageName
//
//import java.io.File
//
//class AmazonReaderTest extends FunSuite with BeforeAndAfterAll {
//  val localstackImage: DockerImageName = DockerImageName.parse("localstack/localstack:0.14.2")
//  val localstack: LocalStackContainer = new LocalStackContainer(localstackImage)
//  localstack.withServices(Service.S3)
//  localstack.start()
//
//  val bucketName: String = "s3-test"
//  val destDatabaseName: String = "s3_database"
//  val destTableName: String = "s3_table"
//
//  val s3: AmazonS3 = AmazonS3ClientBuilder
//    .standard()
//    .withEndpointConfiguration(localstack.getEndpointConfiguration(Service.S3))
//    .withCredentials(localstack.getDefaultCredentialsProvider)
//    .build()
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
//    fileConfig = CsvConfig(fileExtensions = Seq("csv")),
//    incrementalTime = 0
//  )
//
//  val tableSchema: TableSchema = TableSchema(
//    name = destTableName,
//    dbName = destDatabaseName,
//    organizationId = 0,
//    displayName = destTableName,
//    columns = Seq(
//      Int32Column(name = "id", displayName = "id", isNullable = true),
//      StringColumn(name = "name", displayName = "name", isNullable = true),
//      Int32Column(name = "number", displayName = "number", isNullable = true),
//      StringColumn(name = "type", displayName = "type", isNullable = true),
//      DateTimeColumn(
//        name = "datetime",
//        displayName = "datetime",
//        isNullable = true,
//        inputFormats = Seq("yyyy-mm-dd HH:mm:ss")
//      ),
//      StringColumn(name = "country", displayName = "country", isNullable = true)
//    )
//  )
//
//  override def beforeAll(): Unit = {
//    s3.createBucket(bucketName)
//    s3.putObject(bucketName, "products.csv", new File("./data/products.csv"))
//    super.beforeAll()
//  }
//
//  test("test read file from s3") {
//    val expectedData: String =
//      """1,Hu Tieu My Tho,25,Co Ba Sai Gon,2020-01-16 00:00:00.0,Viet Nam
//        |2,Iphone,999,Apple,1999-01-10 00:00:00.0,Viet Nam
//        |3,MacBook13,1999,Apple,2020-01-16 00:00:00.0,US
//        |4,Banh Mi Sai Gon,75,Co Ba Sai Gon,1999-01-10 00:00:00.0,Viet Nam
//        |5,Banh Mi Sai Gon,35,Co Ba Sai Gon,2001-01-10 00:00:00.0,Viet Nam
//        |6,Banh Mi Sai Gon,40,Co Ba Ha Noi,2001-01-10 00:00:00.0,Viet Nam
//        |7,Banh Mi Sai Gon,55,Co Ba Sai Gon,2001-01-10 00:00:00.0,Viet Nam
//        |8,Banh Mi Sai Gon,160,Co Ba Ha Noi,2001-01-10 00:00:00.0,Viet Nam
//        |9,Iphone,950,CellphoneS,2000-01-01 00:00:00.0,US
//        |10,Iphone,1050,China,2010-01-01 00:00:00.0,China
//        |11,Iphone,90,China,2020-01-02 00:00:00.0,China""".stripMargin
//
//    val reader: CloudServiceReader = CloudServiceReader(s3, job)
//    while (reader.hasNext) {
//      val records = reader.next(tableSchema.columns)
//      val actualData = records.map(_.mkString(",")).mkString("\n")
//      assert(actualData.equals(expectedData))
//    }
//    reader.close()
//  }
//}


 // TODO: change to S3CsvReader