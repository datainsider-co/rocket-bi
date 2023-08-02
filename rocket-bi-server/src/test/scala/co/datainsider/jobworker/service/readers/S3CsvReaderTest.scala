//package co.datainsider.jobworker.service.readers
//
//import co.datainsider.bi.client.JdbcClient.Record
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.jobworker.domain.CsvConfig
//import co.datainsider.jobworker.module.JobWorkerTestModule
//import co.datainsider.jobworker.repository.reader.S3CsvReader
//import co.datainsider.jobworker.repository.reader.s3.{MockCloudStorageReader, S3Config, S3StorageReader}
//import co.datainsider.schema.module.MockSchemaClientModule
//import com.amazonaws.services.s3.AmazonS3
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
//
//import java.io.File
//
//class S3CsvReaderTest extends IntegrationTest {
//  override protected def injector: Injector = TestInjector(JobWorkerTestModule, TestContainerModule, MockHadoopFileClientModule, MockLakeClientModule, MockSchemaClientModule).newInstance()
//
//  val s3Client = injector.instance[AmazonS3]
//
//  val bucketName = "products"
//  val fileKey = "products.csv"
//  val filePath = getClass.getClassLoader.getResource("datasets/products.csv").getFile
//
//  override def beforeAll(): Unit = {
//    super.beforeAll()
//    s3Client.createBucket(bucketName)
//    s3Client.putObject(bucketName, fileKey, new File(filePath))
//  }
//
//  override def afterAll(): Unit = {
//    super.afterAll()
//    s3Client.deleteObject(bucketName, fileKey)
//  }
//
//  val s3Config = S3Config(
//    bucketName = "products",
//    folderPath = "products.csv",
//    incrementalSyncTime = 0L
//  )
//  val batchSize = 10
//
//  test("test get csv data from s3 ") {
//    val s3Reader = new S3StorageReader(s3Client, s3Config, Some(1000000L))
//    val csvConfig = CsvConfig(includeHeader = false)
//    val s3CsvReader = new S3CsvReader(s3Reader, csvConfig, batchSize)
//
//    assert(s3CsvReader.hasNext())
//
//    val tableSchema = s3CsvReader.detectTableSchema()
//    assert(tableSchema.columns.nonEmpty)
//    tableSchema.columns.foreach(println)
//
//    while (s3CsvReader.hasNext()) {
//
//      val records: Seq[Record] = s3CsvReader.next(tableSchema)
//
//      records.foreach(r => println(r.mkString(", ")))
//
//      assert(records.nonEmpty)
//      assert(records.size <= batchSize)
//      records.foreach(r => assert(r.size == tableSchema.columns.size))
//    }
//  }
//
//  test("test parse csv with local file") {
//    val filePath = getClass.getClassLoader.getResource("datasets/products.csv").getFile
//    val csvConfig = CsvConfig(includeHeader = true)
//
//    val cloudReader = new MockCloudStorageReader
//    cloudReader.putFile(new File(filePath))
//
//    val s3CsvReader = new S3CsvReader(cloudReader, csvConfig, batchSize)
//
//    val t1 = System.currentTimeMillis()
//
//    assert(s3CsvReader.hasNext())
//
//    val tableSchema = s3CsvReader.detectTableSchema()
//    assert(tableSchema.columns.nonEmpty)
//    tableSchema.columns.foreach(println)
//
//    while (s3CsvReader.hasNext()) {
//
//      val records: Seq[Record] = s3CsvReader.next(tableSchema)
//
//      assert(records.nonEmpty)
//      assert(records.size <= batchSize)
//      records.foreach(r => assert(r.size == tableSchema.columns.size))
//    }
//
//    println(s"elapse time: ${System.currentTimeMillis() - t1}")
//  }
//}
