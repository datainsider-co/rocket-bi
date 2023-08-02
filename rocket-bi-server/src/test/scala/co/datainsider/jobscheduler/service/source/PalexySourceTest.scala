package co.datainsider.jobscheduler.service.source

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.source.{DataSource, LazadaSource, PalexySource}
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.DataSourceService
import co.datainsider.jobscheduler.util.Implicits.FutureEnhance
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class PalexySourceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).create


  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val expectedSource = PalexySource(
    orgId = 11,
    id = 1,
    displayName = "name",
    creatorId = "tvc12",
    lastModify = System.currentTimeMillis(),
    apiKey = "tvc12"
  )
  var newSourceId = 0L

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  test("test create source success") {
    val result: Option[DataSource] = await(sourceService.create(expectedSource.orgId, expectedSource.creatorId, expectedSource))
    assert(result.isDefined)
    val resultSource = result.get.asInstanceOf[PalexySource]
    newSourceId = result.get.getId
    assertSource(resultSource, expectedSource)
  }

  private def assertSource(resultSource: PalexySource, expectedSource: PalexySource): Unit = {
    assert(resultSource.orgId == expectedSource.orgId)
    assert(resultSource.creatorId == expectedSource.creatorId)
    assert(resultSource.apiKey == expectedSource.apiKey)
    assert(resultSource.displayName == expectedSource.displayName)

  }

  test("test get source success") {
    val dataSource: Option[DataSource] = await(sourceService.get(this.expectedSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val resultSource = dataSource.get.asInstanceOf[PalexySource]
    assertSource(resultSource, expectedSource)
  }

  test("test update source") {
    val newDataSource = this.expectedSource.copy(
      displayName = "123",
      id = newSourceId,
      lastModify = System.currentTimeMillis(),
      creatorId = "tvc12",
      apiKey = "tvc12_new"
    )
    val isSuccess: Boolean = await(sourceService.update(newDataSource.orgId, newDataSource))
    assert(isSuccess)
    val dataSource: Option[DataSource] = await(sourceService.get(newDataSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val resultSource = dataSource.get.asInstanceOf[PalexySource]
    assertSource(resultSource, newDataSource)

  }

  test("test delete source") {
    val isSuccess: Boolean = await(sourceService.delete(this.expectedSource.orgId, newSourceId))
    assert(isSuccess)
    assert(await(sourceService.get(this.expectedSource.orgId, newSourceId)).isEmpty)
  }

}
