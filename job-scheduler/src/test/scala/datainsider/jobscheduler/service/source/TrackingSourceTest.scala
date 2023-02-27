package datainsider.jobscheduler.service.source

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.jobscheduler.domain.source.{TrackingSource, TrackingSourceType}
import datainsider.jobscheduler.module.TestModule
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.service.DataSourceService
import datainsider.jobscheduler.util.Implicits.FutureEnhance
import datainsider.jobscheduler.util.JsonUtils
import org.scalatest.BeforeAndAfterAll

class TrackingSourceTest extends IntegrationTest with BeforeAndAfterAll {

  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, MockCaasClientModule).newInstance()
  val sourceService: DataSourceService = injector.instance[DataSourceService]

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }
  var sourceId = 0L
  var trackingSource: TrackingSource = null
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
    trackingSource= source.get.asInstanceOf[TrackingSource]
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
