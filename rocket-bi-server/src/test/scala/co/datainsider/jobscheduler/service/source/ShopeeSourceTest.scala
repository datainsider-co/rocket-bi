package co.datainsider.jobscheduler.service.source

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.source.{DataSource, ShopeeSource}
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.DataSourceService
import co.datainsider.jobscheduler.util.Implicits.FutureEnhance
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class ShopeeSourceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()


  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val expectedSource = ShopeeSource(
    orgId = 1,
    id = 1,
    displayName = "name",
    accessToken = "access_token",
    refreshToken = "refresh_token",
    shopIds = Set("a", "b"),
    creatorId = "tvc12",
    lastModify = System.currentTimeMillis()
  )
  var newSourceId = 0L

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  test("test create source success") {
    val result: Option[DataSource] =
      sourceService.create(expectedSource.orgId, expectedSource.creatorId, expectedSource).sync()
    assert(result.isDefined)
    val resultSource = result.get.asInstanceOf[ShopeeSource]
    assert(resultSource.orgId == expectedSource.orgId)
    assert(resultSource.creatorId == expectedSource.creatorId)
    assert(resultSource.refreshToken == expectedSource.refreshToken)
    assert(resultSource.displayName == expectedSource.displayName)
    assert(resultSource.accessToken == expectedSource.accessToken)
    assert(resultSource.shopIds == expectedSource.shopIds)
    newSourceId = resultSource.id
  }

  test("test get source success") {
    val dataSource: Option[DataSource] = await(sourceService.get(this.expectedSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val resultSource = dataSource.get.asInstanceOf[ShopeeSource]
    assert(resultSource.orgId == this.expectedSource.orgId)
    assert(resultSource.creatorId == this.expectedSource.creatorId)
    assert(resultSource.refreshToken == this.expectedSource.refreshToken)
    assert(resultSource.displayName == this.expectedSource.displayName)
    assert(resultSource.accessToken == this.expectedSource.accessToken)
    assert(resultSource.shopIds == this.expectedSource.shopIds)
  }

  test("test update source") {
    val newDataSource = this.expectedSource.copy(
      displayName = "123",
      refreshToken = "localhost:909245",
      id = newSourceId,
      shopIds = Set("a", "b", "c")
    )
    val isSuccess: Boolean = await(sourceService.update(this.expectedSource.orgId, newDataSource))
    assert(isSuccess)
    val dataSource: Option[DataSource] = await(sourceService.get(this.expectedSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val resultSource = dataSource.get.asInstanceOf[ShopeeSource]
    assert(resultSource.orgId == newDataSource.orgId)
    assert(resultSource.creatorId == newDataSource.creatorId)
    assert(resultSource.refreshToken == newDataSource.refreshToken)
    assert(resultSource.displayName == newDataSource.displayName)
    assert(resultSource.accessToken == newDataSource.accessToken)
    assert(resultSource.shopIds == newDataSource.shopIds)
  }

  test("test delete source") {
    val isSuccess: Boolean = await(sourceService.delete(this.expectedSource.orgId, newSourceId))
    assert(isSuccess)
    assert(await(sourceService.get(this.expectedSource.orgId, newSourceId)).isEmpty)
  }

}
