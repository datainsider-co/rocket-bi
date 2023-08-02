package co.datainsider.jobscheduler.service.source

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.source.{DataSource, GoogleSheetSource}
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.DataSourceService
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class GoogleSheetSourceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()

  val sourceService: DataSourceService = injector.instance[DataSourceService]
  var googleSheetSource: GoogleSheetSource = GoogleSheetSource(
    orgId = 1,
    creatorId = "1",
    displayName = "test",
    accessToken = "access_token",
    refreshToken = "refresh_token",
    id = 1,
    lastModify = 0
  )

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  test("create GoogleSheet data source") {
    val dataSource: Option[DataSource] =
      await(sourceService.create(orgId = 2, creatorId = "2", dataSource = googleSheetSource))
    assert(dataSource.isDefined)
    assert(dataSource.get.getName.equals(googleSheetSource.displayName))
    assert(dataSource.get.getConfig("access_token").equals("access_token"))
    assert(dataSource.get.getConfig("refresh_token").toString.equals("refresh_token"))
    googleSheetSource = dataSource.get.asInstanceOf[GoogleSheetSource]
  }

  test("test get GoogleSheet ") {
    val dataSource = await(sourceService.get(googleSheetSource.orgId, googleSheetSource.id))
    assert(dataSource.isDefined)
    dataSource.get.equals(googleSheetSource)
  }

  test("test update GoogleSheet") {
    val updateResult: Boolean = await(
      sourceService.update(
        orgId = googleSheetSource.orgId,
        googleSheetSource.copy(accessToken = "test_access_token", refreshToken = "test_refresh_token")
      )
    )
    assert(updateResult)
    val dataSource = await(sourceService.get(googleSheetSource.orgId, googleSheetSource.id))
    assert(dataSource.get.getConfig("access_token").equals("test_access_token"))
    assert(dataSource.get.getConfig("refresh_token").toString.equals("test_refresh_token"))
  }

  test("delete google sheet") {
    val deleteResult = await(sourceService.delete(googleSheetSource.orgId, googleSheetSource.id))
    assert(deleteResult)
    val dataSource = await(sourceService.get(googleSheetSource.orgId, googleSheetSource.id))
    assert(dataSource.isEmpty)
  }

}
