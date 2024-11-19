package co.datainsider.bi.domain.request

import co.datainsider.bi.domain.DirectoryType.DirectoryType
import co.datainsider.bi.domain.Ids.{DashboardId, DirectoryId, WidgetId}
import co.datainsider.bi.domain._
import co.datainsider.bi.domain.chart.Widget
import co.datainsider.bi.domain.query.Field
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.{Max, Min}

import javax.inject.Inject

case class GetDashboardRequest(
    @RouteParam id: DashboardId,
    @Inject request: Request
) extends LoggedInRequest

case class CreateDashboardRequest(
    name: String,
    parentDirectoryId: DirectoryId,
    mainDateFilter: Option[MainDateFilter] = None,
    widgets: Option[Array[Widget]] = Some(Array.empty),
    @JsonScalaEnumeration(classOf[DirectoryTypeRef])
    directoryType: DirectoryType = DirectoryType.Dashboard,
    widgetPositions: Map[Long, Position] = Map.empty,
    setting: Option[Map[String, JsonNode]] = None,
    boostInfo: Option[BoostInfo] = None,
    @Inject request: Request = null
) extends LoggedInRequest

case class CreateFromTemplateRequest(
    templateId: Long,
    name: String,
    parentDirectoryId: Long,
    @Inject request: Request = null
) extends LoggedInRequest

case class ListTemplateDashboardsRequest(
    @RouteParam keyword: String = "",
    @RouteParam @Min(0) from: Int = 0,
    @RouteParam @Min(0) @Max(1000) size: Int = 20,
    @Inject request: Request = null
) extends LoggedInRequest

//case class CreateTemplateRequest(
//    name: String,
//    description: String = "",
//    dashboard: Dashboard,
//    thumbnail: String,
//    setting: TemplateSetting,
//    @Inject request: Request = null
//) extends LoggedInRequest
//
//case class UpdateTemplateRequest(
//    @RouteParam id: Long,
//    name: Option[String] = None,
//    description: Option[String] = None,
//    dashboard: Option[Dashboard] = None,
//    thumbnail: Option[String] = None,
//    setting: Option[TemplateSetting] = None,
//    @Inject request: Request = null
//) extends LoggedInRequest

case class RenameDashboardRequest(
    @RouteParam id: DashboardId,
    toName: String,
    @Inject request: Request = null
) extends LoggedInRequest

case class DeleteDashboardRequest(
    @RouteParam id: DashboardId,
    @Inject request: Request = null
) extends LoggedInRequest

case class UpdateMainDateFilterRequest(
    @RouteParam id: DashboardId,
    mainDateFilter: Option[MainDateFilter],
    @Inject request: Request = null
) extends LoggedInRequest

case class GetWidgetRequest(
    @RouteParam dashboardId: DashboardId,
    @RouteParam widgetId: WidgetId,
    @Inject request: Request = null
) extends LoggedInRequest

case class CreateWidgetRequest(
    @RouteParam dashboardId: DashboardId,
    widget: Widget,
    position: Position,
    @Inject request: Request = null
) extends LoggedInRequest

case class EditWidgetRequest(
    @RouteParam dashboardId: DashboardId,
    @RouteParam widgetId: WidgetId,
    widget: Widget,
    @Inject request: Request = null
) extends LoggedInRequest

case class ResizeWidgetsRequest(
    @RouteParam dashboardId: DashboardId,
    positions: Option[Map[WidgetId, Position]],
    @Inject request: Request = null
) extends LoggedInRequest

case class DeleteWidgetRequest(
    @RouteParam dashboardId: DashboardId,
    @RouteParam widgetId: WidgetId,
    @Inject request: Request = null
) extends LoggedInRequest

case class ShareDashboardRequest(
    @RouteParam id: DashboardId,
    actions: Array[String],
    @Inject request: Request = null
) extends LoggedInRequest

case class UpdateSettingsRequest(
    @RouteParam id: DashboardId,
    name: Option[String] = None,
    mainDateFilter: Option[MainDateFilter] = None,
    boostInfo: Option[BoostInfo] = None,
    setting: Option[Map[String, JsonNode]] = None,
    useAsTemplate: Option[Boolean] = None,
    @Inject request: Request = null
) extends LoggedInRequest

// List go through by field
case class ListDrillThroughDashboardRequest(
    fields: Array[Field],
    excludeIds: Array[DashboardId] = Array.empty,
    isRemoved: Option[Boolean] = None,
    @Min(0) from: Int = 0,
    @Min(0) size: Int = 1000,
    @Inject request: Request = null
) extends LoggedInRequest
    with PageRequest

case class RefreshBoostRequest(
    @RouteParam id: DashboardId,
    @Inject request: Request = null
) extends LoggedInRequest

case class ForceBoostRequest(
    @RouteParam id: DashboardId,
    @Inject request: Request = null
) extends LoggedInRequest
