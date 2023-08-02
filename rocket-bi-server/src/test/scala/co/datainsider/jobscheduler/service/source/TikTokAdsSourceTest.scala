package co.datainsider.jobscheduler.service.source

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.source.{DataSource, TikTokAdsSource}
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.DataSourceService
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

class TikTokAdsSourceTest extends IntegrationTest {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()

  val sourceService: DataSourceService = injector.instance[DataSourceService]
  var tikTokAdsSource = TikTokAdsSource(
    orgId = 3,
    creatorId = "1",
    displayName = "test",
    accessToken = "access_token",
    id = 1,
    lastModify = 0
  )

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  test("create tiktok ads source") {
    val dataSource: Option[DataSource] =
      await(sourceService.create(orgId = 3, creatorId = "2", dataSource = tikTokAdsSource))
    assert(dataSource.isDefined)
    assert(dataSource.get.getName.equals(tikTokAdsSource.displayName))
    assert(dataSource.get.getConfig("access_token").toString.equals(tikTokAdsSource.accessToken))
    tikTokAdsSource = dataSource.get.asInstanceOf[TikTokAdsSource]
  }

  test("update tiktok ads source") {
    val isSuccess =
      await(sourceService.update(orgId = 3, source = this.tikTokAdsSource.copy(accessToken = "new_token")))
    assert(isSuccess)
    val updatedSource = await(sourceService.get(orgId = 3, tikTokAdsSource.id))
    assert(updatedSource.isDefined)
    assert(updatedSource.get.getConfig("access_token").equals("new_token"))
  }

  test("delete tiktok ads") {
    val isSuccess = await(sourceService.delete(3, tikTokAdsSource.id))
    assert(isSuccess)
  }
}
