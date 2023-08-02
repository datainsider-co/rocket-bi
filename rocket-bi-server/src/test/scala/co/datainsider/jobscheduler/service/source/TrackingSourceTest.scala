package co.datainsider.jobscheduler.service.source

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.source.{TrackingSource, TrackingSourceType}
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.DataSourceService
import co.datainsider.jobscheduler.util.Implicits.FutureEnhance
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class TrackingSourceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()


  val sourceService: DataSourceService = injector.instance[DataSourceService]
  var sourceId = 0L
  var trackingSource: TrackingSource = null

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  test("test create tracking source ") {
    val dataSource =
      TrackingSource(
        orgId = 1,
        id = 1,
        displayName = "test",
        creatorId = "",
        apiKey = "key",
        sourceType = TrackingSourceType.JsSource
      )
    val source = sourceService.create(1, "root", dataSource).sync()
    assert(source.isDefined)
    trackingSource = source.get.asInstanceOf[TrackingSource]
  }
  test("test get tracking source") {
    val result = await(sourceService.get(trackingSource.orgId, trackingSource.id))
    assert(result.isDefined)
    assert(result.get.equals(trackingSource))
  }

  test("test delete tracking Source") {
    val isSuccess = await(sourceService.delete(trackingSource.orgId, trackingSource.id))
    assert(isSuccess)
  }
}
