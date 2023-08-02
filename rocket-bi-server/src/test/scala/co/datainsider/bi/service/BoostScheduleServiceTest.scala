package co.datainsider.bi.service

import co.datainsider.bi.domain.chart.{Chart, SeriesChartSetting, TableColumn}
import co.datainsider.bi.domain.query.{Count, GroupBy, TableField}
import co.datainsider.bi.domain.{BoostInfo, Dashboard}
import co.datainsider.bi.module.{TestContainerModule, TestModule}
import co.datainsider.schema.module.MockSchemaClientModule
import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.scheduler.ScheduleMinutely

class BoostScheduleServiceTest extends IntegrationTest {

  override protected def injector: Injector =
    TestInjector(TestModule, MockSchemaClientModule, TestContainerModule).newInstance()
  private val schedulerService = injector.instance[BoostScheduleService]

  test("test start schedule boost job") {
    schedulerService.start()
    assert(schedulerService.status.totalJobs == 2)
    Thread.sleep(1000)
  }

  var dashboardId = 3
  test("test add schedule for new dashboard") {
    val newDashboard = Dashboard(
      orgId = 0L,
      id = dashboardId,
      name = s"mock dashboard $dashboardId",
      creatorId = "root",
      ownerId = "root",
      setting = None,
      mainDateFilter = None,
      widgets = Some(
        Array(
          Chart(
            id = 1,
            name = "chart",
            description = "",
            setting = SeriesChartSetting(
              xAxis = TableColumn("Country", GroupBy(field = TableField("db_name", "table_name", "Country", "String"))),
              yAxis = Array(
                TableColumn("UnitCost", Count(field = TableField("db_name", "table_name", "UnitCost", "UInt32")))
              ),
              legend = None,
              breakdown = None
            )
          )
        )
      ),
      boostInfo = Some(BoostInfo(enable = true, ScheduleMinutely(10)))
    )
    schedulerService.scheduleJob(newDashboard)
    assert(schedulerService.status.totalJobs == 3)
  }

  test("test delete schedule") {
    schedulerService.unscheduleJob(dashboardId)
    assert(schedulerService.status.totalJobs == 2)
  }

}
