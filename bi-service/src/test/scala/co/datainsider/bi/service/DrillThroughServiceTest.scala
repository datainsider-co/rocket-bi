package co.datainsider.bi.service

import co.datainsider.bi.domain.Dashboard
import co.datainsider.bi.domain.chart.{Chart, DropdownFilterChartSetting, TabFilterChartSetting, TableColumn}
import co.datainsider.bi.domain.query.{Field, GroupBy, TableField}
import co.datainsider.bi.module.TestModule
import co.datainsider.bi.repository.SchemaManager
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}

class DrillThroughServiceTest extends IntegrationTest {
  override protected def injector: Injector = TestInjector(TestModule).newInstance()

  val drillThroughService: DrillThroughService = injector.instance[DrillThroughService]
  val schemaManager: SchemaManager = injector.instance[SchemaManager]

  val field1: TableField = TableField("Animal", "Cat", "Name", "string");
  val field2: TableField = TableField("Animal2", "Cat2", "Name2", "number");

  val filter1: Chart = Chart(
    id = 1,
    name = "catting",
    description = "catting",
    setting = DropdownFilterChartSetting(
      value = TableColumn("Table", GroupBy(field1))
    )
  )
  val filter2: Chart = Chart(
    id = 1,
    name = "Alo ha",
    description = "Alo ha",
    setting = TabFilterChartSetting(
      value = TableColumn("Table2", GroupBy(field2))
    )
  )
  var dashboard: Dashboard = Dashboard(
    id = -100,
    name = "Test dashboard",
    creatorId = "123",
    ownerId = "123",
    setting = None,
    mainDateFilter = None,
    widgets = Some(Array(filter1, filter2)),
    widgetPositions = None
  )

  override def beforeAll(): Unit = {
    await(schemaManager.ensureDatabase())
    await(drillThroughService.deleteDrillThroughFields(dashboard.id))
  }

  override def afterAll(): Unit = {
    await(drillThroughService.deleteDrillThroughFields(dashboard.id))
  }

  test("Set Drill Through Fields") {
    await(drillThroughService.updateDrillThroughFields(dashboard))
    val tableFields: Seq[Field] = await(drillThroughService.getDrillThroughFields(dashboard.id))
    assertResult(2)(tableFields.size)
  }

  test("Set Drill Through Fields with dashboard empty") {
    await(drillThroughService.updateDrillThroughFields(dashboard.copy(widgets = None)))
    val tableFields: Seq[Field] = await(drillThroughService.getDrillThroughFields(dashboard.id))
    assertResult(0)(tableFields.size)
  }

  test("Delete all field by dashboard id") {
    // set filters
    await(drillThroughService.updateDrillThroughFields(dashboard))
    // tests insert ok
    val insertResult: Seq[Field] = await(drillThroughService.getDrillThroughFields(dashboard.id))
    assertResult(2)(insertResult.size)
    // delete
    await(drillThroughService.deleteDrillThroughFields(dashboard.id))
    // check delete ok
    val deleteResult: Seq[Field] = await(drillThroughService.getDrillThroughFields(dashboard.id))
    assertResult(0)(deleteResult.size)
  }

  test("Scan and create drill through field") {
    val turnOn = false
    if (turnOn) {
      await(drillThroughService.scanAndUpdateDrillThroughFields())
    }
  }
}
