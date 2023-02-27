package datainsider.jobscheduler.service.source

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.jobscheduler.domain.{DataSource, GoogleAdsSource}
import datainsider.jobscheduler.module.TestModule
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.service.DataSourceService

class GoogleAdsSourceTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, MockCaasClientModule).newInstance()

  val sourceService: DataSourceService = injector.instance[DataSourceService]
  var googleAdsSource: GoogleAdsSource = GoogleAdsSource(
    orgId = 1,
    creatorId = "1",
    displayName = "test",
    refreshToken = "refresh_token",
    id = 1,
    lastModify = 0
  )

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  test("create google ads source") {
    val dataSource: Option[DataSource] =
      await(sourceService.create(orgId = 2, creatorId = "2", dataSource = googleAdsSource))
    assert(dataSource.isDefined)
    assert(dataSource.get.getName.equals(googleAdsSource.displayName))
    assert(dataSource.get.getConfig("refresh_token").equals(googleAdsSource.refreshToken))
    googleAdsSource = dataSource.get.asInstanceOf[GoogleAdsSource]
  }

  test("update google ads source") {
    val isSuccess =
      await(sourceService.update(orgId = 2, source = this.googleAdsSource.copy(refreshToken = "new_token")))
    assert(isSuccess)
    val updatedSource = await(sourceService.get(orgId = 2, googleAdsSource.id))
    assert(updatedSource.isDefined)
    assert(updatedSource.get.getConfig("refresh_token").equals("new_token"))
  }

  test("delete google ads") {
    val isSuccess = await(sourceService.delete(2, googleAdsSource.id))
    assert(isSuccess)
  }
}
