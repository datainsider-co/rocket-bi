package co.datainsider.bi.repository

import co.datainsider.bi.domain.Ids.DashboardId
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
  private val repository = injector.instance[DashboardRepository]
  var id = 0L
  private val ownerId = "root"

  override def beforeAll(): Unit = {
    val schemaManager = injector.instance[SchemaManager]
    await(schemaManager.ensureDatabase())
  }


  private def createDashboard(): DashboardId = {
    await(repository.create(Dashboard(name = "new dashboard", creatorId = ownerId, ownerId = ownerId)))
  }

  test("test create dashboard") {
    id = createDashboard()
    assert(id != 0)
  }

  test("test get dashboard with empty setting") {
    val dashboard: Option[Dashboard] = repository.get(id).syncGet()
    assert(dashboard.isDefined)
    assert(dashboard.get.mainDateFilter.isEmpty)
    assert(dashboard.get.boostInfo.isEmpty)
    assert(dashboard.get.setting.isEmpty)
  }

  test("test update dashboard setting") {
    val ok = repository
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
    val dashboard: Option[Dashboard] = repository.get(id).syncGet()
    assert(dashboard.isDefined)
    assert(dashboard.get.mainDateFilter.isDefined)
    assert(dashboard.get.boostInfo.isDefined)
    assert(dashboard.get.setting.isDefined)
  }

  test("test delete dashboard") {
    val ok = repository.delete(id).syncGet
    assert(ok)
  }

  test("test multi delete dashboard empty") {
    val ok = repository.multiDelete(Array.empty[DashboardId]).syncGet
    assert(ok == true)
  }

  test("test multi delete dashboards") {
    val ids = Set(createDashboard(), createDashboard(), createDashboard()).toArray
    assert(ids.length == 3)
    val ok = await(repository.multiDelete(ids))
    assert(ok)
    ids.foreach(id => assert(repository.get(id).syncGet().isEmpty))
  }

  test("test update owner id") {
    val dashboardIds = Array(createDashboard(), createDashboard(), createDashboard())
    val newOwnerId = "new_owner"
    val isUpdated = await(repository.updateOwnerId(fromUsername = ownerId, toUsername = newOwnerId))
    assert(isUpdated)
    dashboardIds.foreach(id => {
      val dashboard: Option[Dashboard] = await(repository.get(id))
      assert(dashboard.isDefined)
      assert(dashboard.get.ownerId == newOwnerId)
      assert(dashboard.get.creatorId == ownerId)
    })
    dashboardIds.foreach(id => await(repository.delete(id)))
  }

  test("test update creator id") {
    val dashboardIds = Array(createDashboard(), createDashboard(), createDashboard())
    val newCreatorId = "new_creator"
    val isUpdated = await(repository.updateCreatorId(fromUsername = ownerId, toUsername = newCreatorId))
    assert(isUpdated)
    dashboardIds.foreach(id => {
      val dashboard = await(repository.get(id))
      assert(dashboard.isDefined)
      assert(dashboard.get.ownerId == ownerId)
      assert(dashboard.get.creatorId == newCreatorId)
    })
    dashboardIds.foreach(id => await(repository.delete(id)))
  }
}
