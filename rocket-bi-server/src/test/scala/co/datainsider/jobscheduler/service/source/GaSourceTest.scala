package co.datainsider.jobscheduler.service.source

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.source.{DataSource, GaSource}
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.DataSourceService
import co.datainsider.jobscheduler.util.Implicits.FutureEnhance
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class GaSourceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()


  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val dataSource = GaSource(1L, 1L, "ga-source", "refresh-token", "access-token")
  var newSourceId = 0L

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  test("test create source success") {
    val result: Option[DataSource] = sourceService.create(dataSource.orgId, dataSource.creatorId, dataSource).sync()
    assert(result.isDefined)
    val gaSource = result.get.asInstanceOf[GaSource]
    assert(gaSource.orgId == dataSource.orgId)
    assert(gaSource.creatorId == dataSource.creatorId)
    assert(gaSource.refreshToken == dataSource.refreshToken)
    assert(gaSource.displayName == dataSource.displayName)
    assert(gaSource.accessToken == dataSource.accessToken)
    newSourceId = gaSource.id
  }

  test("test get source success") {
    val dataSource: Option[DataSource] = await(sourceService.get(this.dataSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val gaSource = dataSource.get.asInstanceOf[GaSource]
    assert(gaSource.orgId == this.dataSource.orgId)
    assert(gaSource.creatorId == this.dataSource.creatorId)
    assert(gaSource.refreshToken == this.dataSource.refreshToken)
    assert(gaSource.displayName == this.dataSource.displayName)
    assert(gaSource.accessToken == this.dataSource.accessToken)
  }

  test("test update source") {
    val newDataSource = this.dataSource.copy(
      displayName = "123",
      refreshToken = "localhost:909245",
      id = newSourceId
    )
    val isSuccess: Boolean = await(sourceService.update(this.dataSource.orgId, newDataSource))
    assert(isSuccess)
    val dataSource: Option[DataSource] = await(sourceService.get(this.dataSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val gaSource = dataSource.get.asInstanceOf[GaSource]
    assert(gaSource.orgId == newDataSource.orgId)
    assert(gaSource.creatorId == newDataSource.creatorId)
    assert(gaSource.refreshToken == newDataSource.refreshToken)
    assert(gaSource.displayName == newDataSource.displayName)
    assert(gaSource.accessToken == newDataSource.accessToken)
  }

  test("test delete source") {
    val isSuccess: Boolean = await(sourceService.delete(this.dataSource.orgId, newSourceId))
    assert(isSuccess)
    assert(await(sourceService.get(this.dataSource.orgId, newSourceId)).isEmpty)
  }

}
