package datainsider.jobscheduler.service.source

import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.module.{MockCaasClientModule, MockSchemaClientModule}
import datainsider.jobscheduler.domain.source.FacebookAdsSource
import datainsider.jobscheduler.domain.{DataSource, GoogleAdsSource}
import datainsider.jobscheduler.module.TestModule
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.service.DataSourceService

class FacebookAdsSourceTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, MockCaasClientModule).newInstance()

  val sourceService: DataSourceService = injector.instance[DataSourceService]
  var facebookAdsSource = FacebookAdsSource(
    orgId = 1,
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

  test("create fb ads source") {
    val dataSource: Option[DataSource] =
      await(sourceService.create(orgId = 2, creatorId = "2", dataSource = facebookAdsSource))
    assert(dataSource.isDefined)
    assert(dataSource.get.getName.equals(facebookAdsSource.displayName))
    println(dataSource.get.getConfig("access_token"))
    assert(dataSource.get.getConfig("access_token").toString.equals(facebookAdsSource.accessToken))
    facebookAdsSource = dataSource.get.asInstanceOf[FacebookAdsSource]
  }

  test("update fb ads source") {
    val isSuccess =
      await(sourceService.update(orgId = 2, source = this.facebookAdsSource.copy(accessToken = "new_token")))
    assert(isSuccess)
    val updatedSource = await(sourceService.get(orgId = 2, facebookAdsSource.id))
    assert(updatedSource.isDefined)
    assert(updatedSource.get.getConfig("access_token").equals("new_token"))
  }

  test("delete fb ads") {
    val isSuccess = await(sourceService.delete(2, facebookAdsSource.id))
    assert(isSuccess)
  }
}
