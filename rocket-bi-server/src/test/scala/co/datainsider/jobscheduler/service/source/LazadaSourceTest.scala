package co.datainsider.jobscheduler.service.source

import co.datainsider.bi.module.TestContainerModule
import co.datainsider.caas.user_profile.module.MockCaasClientModule
import co.datainsider.jobscheduler.domain.source.{DataSource, LazadaSource}
import co.datainsider.jobscheduler.module.JobScheduleTestModule
import co.datainsider.jobscheduler.repository.SchemaManager
import co.datainsider.jobscheduler.service.DataSourceService
import co.datainsider.jobscheduler.util.Implicits.FutureEnhance
import com.google.inject.name.Names
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import org.scalatest.BeforeAndAfterAll

class LazadaSourceTest extends IntegrationTest with BeforeAndAfterAll {
  override protected val injector: Injector = TestInjector(JobScheduleTestModule, TestContainerModule, MockCaasClientModule).newInstance()


  val sourceService: DataSourceService = injector.instance[DataSourceService]
  val expectedSource = LazadaSource(
    orgId = 11,
    id = 1,
    displayName = "name",
    accessToken = "access_token_abc",
    refreshToken = "refresh_token_bca",
    creatorId = "tvc12",
    lastModify = System.currentTimeMillis(),
    expiresInSec = 10,
    refreshExpiresIn = 10,
    country = "vn",
    accountId = "account_id",
    account = "account",
    accountPlatform = "account_platform",
    countryUserInfo = "country_user_info"
  )
  var newSourceId = 0L

  override def beforeAll(): Unit = {
    await(injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema())
    await(injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema())
  }

  test("test create source success") {
    val result: Option[DataSource] = sourceService.create(expectedSource.orgId, expectedSource.creatorId, expectedSource).sync()
    assert(result.isDefined)
    val resultSource = result.get.asInstanceOf[LazadaSource]
    newSourceId = result.get.getId
    assertSource(resultSource, expectedSource)
  }

  private def assertSource(resultSource: LazadaSource, expectedSource: LazadaSource): Unit = {
    assert(resultSource.orgId == expectedSource.orgId)
    assert(resultSource.creatorId == expectedSource.creatorId)
    assert(resultSource.refreshToken == expectedSource.refreshToken)
    assert(resultSource.displayName == expectedSource.displayName)
    assert(resultSource.accessToken == expectedSource.accessToken)
    assert(resultSource.account == expectedSource.account)
    assert(resultSource.accountPlatform == expectedSource.accountPlatform)
    assert(resultSource.countryUserInfo == expectedSource.countryUserInfo)
    assert(resultSource.country == expectedSource.country)
    assert(resultSource.expiresInSec == expectedSource.expiresInSec)
    assert(resultSource.refreshExpiresIn == expectedSource.refreshExpiresIn)
    assert(resultSource.accountId == expectedSource.accountId)

  }

  test("test get source success") {
    val dataSource: Option[DataSource] = await(sourceService.get(this.expectedSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val resultSource = dataSource.get.asInstanceOf[LazadaSource]
    assertSource(resultSource, expectedSource)
  }

  test("test update source") {
    val newDataSource = this.expectedSource.copy(
      displayName = "123",
      refreshToken = "new_refresh_token",
      accessToken = "new_access_token",
      id = newSourceId,
      lastModify = System.currentTimeMillis(),
      creatorId = "tvc12",
      account = "account_new",
      accountPlatform = "account_platform_new",
      countryUserInfo = "country_user_info_new",
      country = "vn_new",
      expiresInSec = 100,
      refreshExpiresIn = 100
    )
    val isSuccess: Boolean = await(sourceService.update(newDataSource.orgId, newDataSource))
    assert(isSuccess)
    val dataSource: Option[DataSource] = await(sourceService.get(newDataSource.orgId, newSourceId))
    assert(dataSource.isDefined)

    val resultSource = dataSource.get.asInstanceOf[LazadaSource]
    println(s"refresh_token: ${resultSource.refreshToken}, expected: ${newDataSource.refreshToken}")
    assertSource(resultSource, newDataSource)

  }

  test("test delete source") {
    val isSuccess: Boolean = await(sourceService.delete(this.expectedSource.orgId, newSourceId))
    assert(isSuccess)
    assert(await(sourceService.get(this.expectedSource.orgId, newSourceId)).isEmpty)
  }

}
