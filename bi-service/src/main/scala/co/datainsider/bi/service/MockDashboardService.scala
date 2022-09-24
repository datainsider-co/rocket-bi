package co.datainsider.bi.service

import co.datainsider.bi.domain.Ids.{DashboardId, DirectoryId}
import co.datainsider.bi.domain.{BoostInfo, Dashboard, PermissionToken}
import co.datainsider.bi.domain.chart.{Chart, SeriesChartSetting, TabFilterChartSetting, TableColumn, Widget}
import co.datainsider.bi.domain.query.{Count, GroupBy, In, QueryView, TableField, TableView}
import co.datainsider.bi.domain.request.{
  CreateDashboardRequest,
  CreateWidgetRequest,
  DeleteDashboardRequest,
  DeleteWidgetRequest,
  EditWidgetRequest,
  FilterRequest,
  ForceBoostRequest,
  GetDashboardRequest,
  GetWidgetRequest,
  RefreshBoostRequest,
  RenameDashboardRequest,
  ResizeWidgetsRequest,
  ShareDashboardRequest,
  UpdateMainDateFilterRequest,
  UpdateSettingsRequest
}
import co.datainsider.bi.util.Serializer
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.Future
import datainsider.client.domain.scheduler.{ScheduleHourly, ScheduleMinutely}
import datainsider.client.domain.user.UserProfile

class MockDashboardService extends DashboardService {
  val dashboard1 = Dashboard(
    id = 1,
    name = "mock dashboard 1",
    creatorId = "root",
    ownerId = "root",
    setting = None,
    mainDateFilter = None,
    widgets = Some(
      Array(
        Chart(
          id = 0,
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
        ),
        Chart(
          id = 1,
          name = "filter",
          description = "",
          setting = TabFilterChartSetting(
            value = TableColumn("Country", GroupBy(field = TableField("db_name", "table_name", "Country", "String"))),
            filterRequest = Some(
              FilterRequest(
                condition = In(TableField("db_name", "tbl_name", "Country", "string"), Set("Asia", "Europe"))
              )
            )
          )
        )
      )
    ),
    boostInfo = Some(BoostInfo(enable = true, ScheduleMinutely(20)))
  )
  val dashboard2 = Dashboard(
    id = 2,
    name = "mock dashboard 2",
    creatorId = "root",
    ownerId = "root",
    setting = None,
    mainDateFilter = None,
    widgets = Some(
      Array(
        Chart(
          id = 0,
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
        ),
        Chart(
          id = 1,
          name = "filter",
          description = "",
          setting = TabFilterChartSetting(
            value = TableColumn("Country", GroupBy(field = TableField("db_name", "table_name", "Country", "String"))),
            filterRequest = Some(
              FilterRequest(
                condition = In(TableField("db_name", "tbl_name", "Country", "string"), Set("Asia", "Europe"))
              )
            )
          )
        )
      )
    ),
    boostInfo = Option(BoostInfo(enable = true, ScheduleHourly(1)))
  )

  override def list(from: Int, size: Int): Future[Seq[Dashboard]] =
    Future {
      Seq(dashboard1, dashboard2)
    }

  override def count(): Future[DashboardId] = Future(2L)

  override def getOwner(organizationId: Long, toLong: DashboardId): Future[UserProfile] = ???

  override def get(orgId: DashboardId, dashboardId: DashboardId): Future[Dashboard] = Future(dashboard1)

  override def get(request: GetDashboardRequest): Future[Dashboard] = Future(dashboard1)

  override def create(request: CreateDashboardRequest): Future[Dashboard] = ???

  override def rename(request: RenameDashboardRequest): Future[Boolean] = ???

  override def updateMainDateFilter(request: UpdateMainDateFilterRequest): Future[Boolean] = ???

  override def delete(request: DeleteDashboardRequest): Future[Boolean] = ???

  override def share(request: ShareDashboardRequest): Future[PermissionToken] = ???

  override def createWidget(request: CreateWidgetRequest): Future[Widget] = ???

  override def getWidget(request: GetWidgetRequest): Future[Widget] = ???

  override def editWidget(request: EditWidgetRequest): Future[Boolean] = ???

  override def deleteWidget(request: DeleteWidgetRequest): Future[Boolean] = ???

  override def resizeWidgets(request: ResizeWidgetsRequest): Future[Boolean] = ???

  override def updateSettings(request: UpdateSettingsRequest): Future[Boolean] = Future.True

  override def getDirectoryId(id: DashboardId): Future[DirectoryId] = ???

  override def refreshBoost(request: RefreshBoostRequest): Future[Boolean] = ???

  override def forceBoost(request: ForceBoostRequest): Future[Unit] = ???

  override def getWidget(orgId: DashboardId, dashboardId: DashboardId, widgetId: DashboardId): Future[Widget] = ???

  override def updateBoostInfo(dashboard: Dashboard, newBoostInfo: Option[BoostInfo]): Future[Boolean] = Future.True
}
