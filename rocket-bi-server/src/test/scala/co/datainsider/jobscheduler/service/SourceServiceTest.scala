package co.datainsider.jobscheduler.service

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.DatabaseType
import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.request.PaginationRequest
import co.datainsider.jobscheduler.domain.source._
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.util.Implicits.FutureEnhance
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class SourceServiceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()

  val sourceService: DataSourceService = injector.instance[DataSourceService]
  var createdId: SourceId = -1
  var mongoDbSourceId: SourceId = -1
  var amazonS3SourceId: Long = 0
  test("create") {
    val dataSource =
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
    //val request = CreateJdbcSourceRequest("new_data_source", DatabaseType.MySql, "127.0.0.1", "3306", "root", "di@123")
    val result = sourceService.create(1, "root", dataSource).sync()
    createdId = result.get.getId
    assert(createdId != -1)
  }

  test("test list datasource") {
    val sources: Seq[DataSource] =
      sourceService.list(1, PaginationRequest(0, 10, request = null, keyword = Some("new_data_source"))).sync().data
    assert(sources.nonEmpty)
    assert(sources.size == 1)
    val createdSource: JdbcSource = sources.head.asInstanceOf[JdbcSource]
    assert(createdSource.displayName == "new_data_source")
    assert(createdSource.databaseType == DatabaseType.MySql)
  }

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }
  test("create mongodb source") {
    val dataSource = MongoSource(
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
    val result = sourceService.create(1, "root", dataSource).sync()
    mongoDbSourceId = result.get.getId
    assert(mongoDbSourceId != -1)
  }

  test("update mongodb source") {
    val dataSource = MongoSource(
      orgId = 1,
      id = mongoDbSourceId,
      displayName = "updated",
      host = "localhost",
      port = Some("12707"),
      connectionUri = Some("mongodb+srv://<user>:<password>@cluster0.iv2gm.mongodb.net/?retryWrites=true&w=majority"),
      username = "hau",
      password = "123456",
      creatorId = "root",
      lastModify = System.currentTimeMillis()
    )
    val result = sourceService.update(1, dataSource).sync()
    val updatedSource = sourceService.get(1, mongoDbSourceId).sync()
    assert(result)
    assert(updatedSource.get.getName.equals("updated"))
    assert(updatedSource.get.getConfig.contains("connection_uri"))
    assert(
      updatedSource.get.getConfig
        .get("connection_uri")
        .contains(Some("mongodb+srv://<user>:<password>@cluster0.iv2gm.mongodb.net/?retryWrites=true&w=majority"))
    )
  }

  test("create shopify source") {
    val dataSource = ShopifySource(
      orgId = 1,
      id = 1,
      displayName = "shopify",
      "https://dev-datainsider.shopify.com",
      "access-token",
      "2022-01"
    )
    val result: Option[DataSource] = await(sourceService.create(1, "root", dataSource))
    assert(result.isDefined)

    val savedSource: Option[DataSource] = await(sourceService.get(1, result.get.getId))
    assert(savedSource.isDefined)
    assert(savedSource.get.getName == dataSource.getName)
    assertResult(dataSource.getConfig)(savedSource.get.getConfig)

    val isDeleted: Boolean = await(sourceService.delete(1, savedSource.get.getId))
    assert(isDeleted)
  }

  test("test delete data source") {
    println(createdId)
    assert(sourceService.delete(1, createdId).sync())
    assert(sourceService.delete(1, mongoDbSourceId).sync())
  }

  test("test create amazon s3 source") {
    val dataSource = AmazonS3Source(
      orgId = 1,
      id = 1,
      displayName = "amazon s3 source",
      creatorId = "tester",
      lastModify = System.currentTimeMillis(),
      awsAccessKeyId = "s3_id",
      awsSecretAccessKey = "s3_key",
      region = "us-east-1"
    )
    val result = sourceService.create(dataSource.orgId, dataSource.creatorId, dataSource).sync()
    assert(result.nonEmpty)
    val resultDataSource = result.get.asInstanceOf[AmazonS3Source]
    assert(resultDataSource.displayName.equals(dataSource.displayName))
    assert(resultDataSource.awsAccessKeyId.equals(dataSource.awsAccessKeyId))
    assert(resultDataSource.awsSecretAccessKey.equals(dataSource.awsSecretAccessKey))
    amazonS3SourceId = result.get.getId
  }

  test("test get amazon s3 source") {
    val expectedDataSource = AmazonS3Source(
      orgId = 1,
      id = amazonS3SourceId,
      displayName = "amazon s3 source",
      creatorId = "tester",
      lastModify = 0,
      awsAccessKeyId = "s3_id",
      awsSecretAccessKey = "s3_key",
      region = "us-east-1"
    )
    val resultDataSource: DataSource = sourceService.get(1, amazonS3SourceId).sync().get
    assert(expectedDataSource.equals(resultDataSource.asInstanceOf[AmazonS3Source].copy(lastModify = 0)))
  }

  test("test update amazon s3 source") {
    val dataSource = AmazonS3Source(
      orgId = 1,
      id = amazonS3SourceId,
      displayName = "amazon s3 source updated",
      creatorId = "tester",
      lastModify = 0,
      awsAccessKeyId = "s3_id_updated",
      awsSecretAccessKey = "s3_key_updated",
      region = "us-east-1"
    )
    val result: Boolean = sourceService.update(dataSource.orgId, dataSource).sync()
    assert(result)
    val updatedDataSource: DataSource = sourceService.get(dataSource.orgId, dataSource.id).sync().get
    assert(updatedDataSource.asInstanceOf[AmazonS3Source].copy(lastModify = 0).equals(dataSource))
  }

  test("test delete amazon s3 source") {
    val result: Boolean = sourceService.delete(1, amazonS3SourceId).sync()
    assert(result)
    assert(sourceService.get(1, amazonS3SourceId).sync().isEmpty)
  }

}
