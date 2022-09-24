package co.datainsider.bi.repository

import co.datainsider.bi.domain.query.TableField
import co.datainsider.bi.domain.{BoostInfo, Dashboard, MainDateFilter, MainDateFilterMode}
import co.datainsider.bi.module.TestModule
import co.datainsider.bi.util.Serializer
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.inject.{Injector, IntegrationTest}
import com.twitter.inject.app.TestInjector
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.scheduler.ScheduleOnce

class DashboardRepositoryTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule).newInstance()
  private val dashboardRepository = injector.instance[DashboardRepository]

  override def beforeAll(): Unit = {
    val schemaManager = injector.instance[SchemaManager]
    await(schemaManager.ensureDatabase())
  }

  var id = 0L
  test("test create dashboard") {
    id = dashboardRepository.create(Dashboard(name = "new dashboard", creatorId = "root", ownerId = "root")).syncGet
    assert(id != 0)
  }

  test("test get dashboard with empty setting") {
    val dashboard: Option[Dashboard] = dashboardRepository.get(id).syncGet()
    assert(dashboard.isDefined)
    assert(dashboard.get.mainDateFilter.isEmpty)
    assert(dashboard.get.boostInfo.isEmpty)
    assert(dashboard.get.setting.isEmpty)
  }

  test("test update dashboard setting") {
    val ok = dashboardRepository
      .update(
        id,
        Dashboard(
          name = "new dashboard",
          creatorId = "root",
          ownerId = "root",
          mainDateFilter =
            Some(MainDateFilter(TableField("db", "table", "name", "string"), MainDateFilterMode.LastMonth)),
          setting = Some(Serializer.fromJson[JsonNode]("{}")),
          boostInfo = Some(BoostInfo(enable = true, ScheduleOnce(0L)))
        )
      )
      .syncGet()

    assert(ok)
  }

  test("test get dashboard with updated setting") {
    val dashboard: Option[Dashboard] = dashboardRepository.get(id).syncGet()
    assert(dashboard.isDefined)
    assert(dashboard.get.mainDateFilter.isDefined)
    assert(dashboard.get.boostInfo.isDefined)
    assert(dashboard.get.setting.isDefined)
  }

  test("test delete dashboard") {
    val ok = dashboardRepository.delete(id).syncGet
    assert(ok)
  }

}
