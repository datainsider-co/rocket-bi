package co.datainsider.bi.repository

import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.domain.query.TableField
import co.datainsider.bi.domain.{BoostInfo, Dashboard, MainDateFilter, MainDateFilterMode}
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.bi.util.Serializer
import co.datainsider.schema.module.MockSchemaClientModule
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.scheduler.ScheduleOnce

class DashboardRepositoryTest extends IntegrationTest {
  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, TestContainerModule).newInstance()
  private val repository = injector.instance[DashboardRepository]
  var id = 0L
  val orgId = 0L
  private val ownerId = "root"

  override def beforeAll(): Unit = {
    val schemaManager = injector.instance[SchemaManager]
    await(schemaManager.ensureSchema())
  }

  private def createDashboard(): DashboardId = {
    await(
      repository.create(orgId, Dashboard(orgId = orgId, name = "new dashboard", creatorId = ownerId, ownerId = ownerId))
    )
  }

  test("test create dashboard") {
    id = createDashboard()
    assert(id != 0)
  }

  test("test list dashboards") {
    val dashboards: Seq[Dashboard] =
      repository.list(orgId = orgId, from = 0, size = 10, useAsTemplate = Some(false)).syncGet()
    assert(dashboards.nonEmpty)
  }

  test("test count dashboards") {
    val dashboardCount = repository.count(orgId, Some(false)).syncGet()
    assert(dashboardCount > 0)
  }

  test("test get dashboard with empty setting") {
    val dashboard: Option[Dashboard] = repository.get(orgId, id).syncGet()
    assert(dashboard.isDefined)
    assert(dashboard.get.mainDateFilter.isEmpty)
    assert(dashboard.get.boostInfo.isEmpty)
    assert(dashboard.get.setting.isEmpty)
  }

  test("test update dashboard setting") {
    val ok = repository
      .update(
        orgId = orgId,
        id = id,
        dashboard = Dashboard(
          orgId = orgId,
          name = "new dashboard",
          creatorId = "root",
          ownerId = "root",
          mainDateFilter =
            Some(MainDateFilter(TableField("db", "table", "name", "string"), MainDateFilterMode.LastMonth)),
          setting = Some(Serializer.fromJson[JsonNode]("{}")),
          boostInfo = Some(BoostInfo(enable = true, ScheduleOnce(0L))),
          useAsTemplate = true
        )
      )
      .syncGet()

    assert(ok)
  }

  test("test get dashboard with updated setting") {
    val dashboard: Option[Dashboard] = repository.get(orgId, id).syncGet()
    assert(dashboard.isDefined)
    assert(dashboard.get.mainDateFilter.isDefined)
    assert(dashboard.get.boostInfo.isDefined)
    assert(dashboard.get.setting.isDefined)
    assert(dashboard.get.useAsTemplate)
  }

  test("test delete dashboard") {
    val ok = repository.delete(orgId, id).syncGet
    assert(ok)
  }

  test("test multi delete dashboard empty") {
    val ok = repository.multiDelete(orgId, Array.empty[DashboardId]).syncGet
    assert(ok == true)
  }

  test("test multi delete dashboards") {
    val ids = Set(createDashboard(), createDashboard(), createDashboard()).toArray
    assert(ids.length == 3)
    val ok = await(repository.multiDelete(orgId, ids))
    assert(ok)
    ids.foreach(id => assert(repository.get(orgId, id).syncGet().isEmpty))
  }

  test("test update owner id") {
    val dashboardIds = Array(createDashboard(), createDashboard(), createDashboard())
    val newOwnerId = "new_owner"
    val isUpdated = await(repository.updateOwnerId(orgId = orgId, fromUsername = ownerId, toUsername = newOwnerId))
    assert(isUpdated)
    dashboardIds.foreach(id => {
      val dashboard: Option[Dashboard] = await(repository.get(orgId, id))
      assert(dashboard.isDefined)
      assert(dashboard.get.ownerId == newOwnerId)
      assert(dashboard.get.creatorId == ownerId)
    })
    dashboardIds.foreach(id => await(repository.delete(orgId, id)))
  }

  test("test update creator id") {
    val dashboardIds = Array(createDashboard(), createDashboard(), createDashboard())
    val newCreatorId = "new_creator"
    val isUpdated = await(repository.updateCreatorId(orgId = orgId, fromUsername = ownerId, toUsername = newCreatorId))
    assert(isUpdated)
    dashboardIds.foreach(id => {
      val dashboard = await(repository.get(orgId, id))
      assert(dashboard.isDefined)
      assert(dashboard.get.ownerId == ownerId)
      assert(dashboard.get.creatorId == newCreatorId)
    })
    dashboardIds.foreach(id => await(repository.delete(orgId, id)))
  }
}
