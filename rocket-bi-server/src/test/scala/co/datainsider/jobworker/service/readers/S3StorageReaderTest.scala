//package co.datainsider.jobworker.service.readers
//
//import co.datainsider.bi.module.TestContainerModule
//import co.datainsider.jobworker.module.JobWorkerTestModule
//import co.datainsider.jobworker.repository.reader.s3.{S3Config, S3StorageReader}
//import co.datainsider.schema.module.MockSchemaClientModule
//import com.amazonaws.services.s3.AmazonS3
//import com.twitter.inject.app.TestInjector
//import com.twitter.inject.{Injector, IntegrationTest}
//import datainsider.client.module.{MockHadoopFileClientModule, MockLakeClientModule}
//import org.scalatest.BeforeAndAfterAll
//
//import java.io.File
//
//class S3StorageReaderTest extends IntegrationTest with BeforeAndAfterAll {
//  override protected def injector: Injector =
//    TestInjector(JobWorkerTestModule, TestContainerModule, MockHadoopFileClientModule, MockLakeClientModule, MockSchemaClientModule)
//      .newInstance()
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
//
//  private val s3Reader = new S3StorageReader(s3Client, s3Config, None)
//
//  test("test get next file") {
//    assert(s3Reader.hasNext())
//
//    val file = s3Reader.next()
//    assert(file !== null)
//    file.delete()
//  }
//}
