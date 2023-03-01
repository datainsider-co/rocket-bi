package datainsider.jobscheduler.service.source

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.jobscheduler.domain._
import datainsider.jobscheduler.domain.source.Ga4Source
import datainsider.jobscheduler.module.TestModule
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.service.DataSourceService
import datainsider.jobscheduler.util.Implicits.FutureEnhance
import org.scalatest.BeforeAndAfterAll

class Ga4SourceTest extends IntegrationTest with BeforeAndAfterAll {

  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, MockCaasClientModule).newInstance()
  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val dataSource = Ga4Source(1L, 1L, "ga4-source", "refresh-token", "access-token")
  var newSourceId = 0L

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  test("test create source success") {
    val result: Option[DataSource] = sourceService.create(dataSource.orgId, dataSource.creatorId, dataSource).sync()
    assert(result.isDefined)
    val ga4Source = result.get.asInstanceOf[Ga4Source]
    assert(ga4Source.orgId == dataSource.orgId)
    assert(ga4Source.creatorId == dataSource.creatorId)
    assert(ga4Source.refreshToken == dataSource.refreshToken)
    assert(ga4Source.displayName == dataSource.displayName)
    assert(ga4Source.accessToken == dataSource.accessToken)
    newSourceId = ga4Source.id
  }

  test("test get source success") {
    val dataSource: Option[DataSource] = await(sourceService.get(this.dataSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val ga4Source = dataSource.get.asInstanceOf[Ga4Source]
    assert(ga4Source.orgId == this.dataSource.orgId)
    assert(ga4Source.creatorId == this.dataSource.creatorId)
    assert(ga4Source.refreshToken == this.dataSource.refreshToken)
    assert(ga4Source.displayName == this.dataSource.displayName)
    assert(ga4Source.accessToken == this.dataSource.accessToken)
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

    val ga4Source = dataSource.get.asInstanceOf[Ga4Source]
    assert(ga4Source.orgId == newDataSource.orgId)
    assert(ga4Source.creatorId == newDataSource.creatorId)
    assert(ga4Source.refreshToken == newDataSource.refreshToken)
    assert(ga4Source.displayName == newDataSource.displayName)
    assert(ga4Source.accessToken == newDataSource.accessToken)
  }

  test("test delete source") {
    val isSuccess: Boolean = await(sourceService.delete(this.dataSource.orgId, newSourceId))
    assert(isSuccess)
    assert(await(sourceService.get(this.dataSource.orgId, newSourceId)).isEmpty)
  }

}
