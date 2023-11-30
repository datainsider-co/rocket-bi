package co.datainsider.jobscheduler.service.source

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.source.{DataSource, HubspotSource}
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.DataSourceService
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class HubspotSourceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).create


  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val expectedSource = HubspotSource(
    orgId = 11,
    id = 1,
    displayName = "name",
    creatorId = "tvc12",
    apiKey = "refresh_token",
    lastModify = System.currentTimeMillis(),
  )
  var newSourceId = 0L

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  test("test create source success") {
    val result: Option[DataSource] = await(sourceService.create(expectedSource.orgId, expectedSource.creatorId, expectedSource))
    assert(result.isDefined)
    val resultSource = result.get.asInstanceOf[HubspotSource]
    newSourceId = result.get.getId
    assertSource(resultSource, expectedSource)
  }

  private def assertSource(resultSource: HubspotSource, expectedSource: HubspotSource): Unit = {
    assert(resultSource.orgId == expectedSource.orgId)
    assert(resultSource.creatorId == expectedSource.creatorId)
    assert(resultSource.displayName == expectedSource.displayName)
    assert(resultSource.apiKey == expectedSource.apiKey)
  }

  test("test get source success") {
    val dataSource: Option[DataSource] = await(sourceService.get(this.expectedSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val resultSource = dataSource.get.asInstanceOf[HubspotSource]
    assertSource(resultSource, expectedSource)
  }

  test("test update source") {
    val newDataSource = this.expectedSource.copy(
      displayName = "123",
      id = newSourceId,
      lastModify = System.currentTimeMillis(),
      creatorId = "tvc12",
      apiKey = "refresh_token_new",
    )
    val isSuccess: Boolean = await(sourceService.update(newDataSource.orgId, newDataSource))
    assert(isSuccess)
    val dataSource: Option[DataSource] = await(sourceService.get(newDataSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val resultSource = dataSource.get.asInstanceOf[HubspotSource]
    assertSource(resultSource, newDataSource)

  }

  test("test delete source") {
    val isSuccess: Boolean = await(sourceService.delete(this.expectedSource.orgId, newSourceId))
    assert(isSuccess)
    assert(await(sourceService.get(this.expectedSource.orgId, newSourceId)).isEmpty)
  }

}
