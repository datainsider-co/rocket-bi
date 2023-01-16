package co.datainsider.bi.controller.http

import co.datainsider.bi.controller.http.filter._
import co.datainsider.bi.domain.Directory.{MyData, Shared}
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain.query.event.{ActionType, ResourceType}
import co.datainsider.bi.domain.request._
import co.datainsider.bi.service.{DrillThroughService, DashboardService, DirectoryService}
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.util.Future
import datainsider.client.exception.UnsupportedError
import datainsider.client.filter.MustLoggedInFilter
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

class DashboardController @Inject() (
                                      dashboardService: DashboardService,
                                      directoryService: DirectoryService,
                                      drillThroughService: DrillThroughService,
                                      dashboardFilter: DashboardPermissionFilter,
                                      directoryFilter: DirectoryPermissionFilter
) extends Controller {

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "id"),
      dashboardFilter.requireUserPermission(action = "view", dashboardParamName = "id"),
      dashboardFilter.requireTokenPermission(action = "view", dashboardParamName = "id")
    )
  )
    .get(s"/dashboards/:id") { request: GetDashboardRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::GetDashboardRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Dashboard,
        description = s"view dashboard ${request.id}"
      ) {
        dashboardService.get(request)
      }
    }

  filter(
    OrFilter(
      directoryFilter.requireDirectoryOwner("parent_directory_id"),
      directoryFilter.requireUserPermission("create", "parent_directory_id"),
      directoryFilter.requireTokenPermission("create", "parent_directory_id")
    )
  )
    .post(s"/dashboards/create") { request: CreateDashboardRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::CreateDashboardRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Dashboard,
        description = s"create new dashboard '${request.name}''"
      ) {
        request.parentDirectoryId match {
          case Shared => Future.exception(UnsupportedError("unsupported create dashboard at root shared"))
          case MyData =>
            for {
              rootId <- getRootId(request.request)
              result <- dashboardService.create(request.copy(parentDirectoryId = rootId))
            } yield result
          case _ => dashboardService.create(request)
        }
      }
    }

  private def getRootId(request: Request): Future[DirectoryId] =
    Profiler(s"[Http] ${this.getClass.getSimpleName}::getRootId") {
      directoryService.getRootDir(GetRootDirectoryRequest(request)).map(_.id)
    }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "id"),
      dashboardFilter.requireUserPermission(action = "edit", dashboardParamName = "id"),
      dashboardFilter.requireTokenPermission(action = "edit", dashboardParamName = "id")
    )
  )
    .put(s"/dashboards/:id/rename") { request: RenameDashboardRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::RenameDashboardRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Dashboard,
        description = s"rename dashboard ${request.id} to ${request.toName}"
      ) {
        dashboardService.rename(request).map(toResponse)
      }
    }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "id"),
      dashboardFilter.requireUserPermission(action = "edit", dashboardParamName = "id"),
      dashboardFilter.requireTokenPermission(action = "edit", dashboardParamName = "id")
    )
  )
    .put(s"/dashboards/:id/main_date_filter/edit") { request: UpdateMainDateFilterRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::UpdateMainDateFilterRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Dashboard,
        description = s"update main date filter of dashboard ${request.id}"
      ) {
        dashboardService.updateMainDateFilter(request).map(toResponse)
      }
    }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "id"),
      dashboardFilter.requireUserPermission(action = "delete", dashboardParamName = "id"),
      dashboardFilter.requireTokenPermission(action = "delete", dashboardParamName = "id")
    )
  )
    .delete(s"/dashboards/:id") { request: DeleteDashboardRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::DeleteDashboardRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Dashboard,
        description = s"delete dashboard ${request.id}"
      ) {
        dashboardService.delete(request).map(toResponse)
      }
    }

  filter[MustLoggedInFilter]
    .filter(
      OrFilter(
        dashboardFilter.requireDirectoryOwner(dashboardParamName = "id"),
        dashboardFilter.requireUserPermission(action = "share", dashboardParamName = "id")
      )
    )
    .post(s"/dashboards/:id/share") { request: ShareDashboardRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::ShareDashboardRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Dashboard,
        description = s"share dashboard ${request.id}"
      ) {
        dashboardService.share(request)
      }
    }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "dashboard_id"),
      dashboardFilter.requireUserPermission(action = "view", dashboardParamName = "dashboard_id"),
      dashboardFilter.requireTokenPermission(action = "view", dashboardParamName = "dashboard_id")
    )
  )
    .get(s"/dashboards/:dashboard_id/widgets/:widget_id") { request: GetWidgetRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::GetWidgetRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Widget,
        description = s"view widget ${request.widgetId} of dashboard ${request.dashboardId}"
      ) {
        dashboardService.getWidget(request)
      }
    }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "dashboard_id"),
      dashboardFilter.requireUserPermission(action = "create", dashboardParamName = "dashboard_id"),
      dashboardFilter.requireTokenPermission(action = "create", dashboardParamName = "dashboard_id")
    )
  )
    .post(s"/dashboards/:dashboard_id/widgets/create") { request: CreateWidgetRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::CreateWidgetRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Widget,
        description = s"create widget ${request.widget.name} in dashboard ${request.dashboardId}"
      ) {
        dashboardService.createWidget(request)
      }
    }

  filter[ShareTokenParser]
    .filter(
      OrFilter(
        dashboardFilter.requireDirectoryOwner(dashboardParamName = "dashboard_id"),
        dashboardFilter.requireUserPermission(action = "edit", dashboardParamName = "dashboard_id"),
        dashboardFilter.requireTokenPermission(action = "edit", dashboardParamName = "dashboard_id")
      )
    )
    .put(s"/dashboards/:dashboard_id/widgets/:widget_id/edit") { request: EditWidgetRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::EditWidgetRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Widget,
        description = s"edit widget ${request.widget.name} in dashboard ${request.dashboardId}"
      ) {
        dashboardService.editWidget(request).map(toResponse)
      }
    }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "dashboard_id"),
      dashboardFilter.requireUserPermission(action = "delete", dashboardParamName = "dashboard_id"),
      dashboardFilter.requireTokenPermission(action = "delete", dashboardParamName = "dashboard_id")
    )
  )
    .delete(s"/dashboards/:dashboard_id/widgets/:widget_id") { request: DeleteWidgetRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::DeleteWidgetRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Widget,
        description = s"delete widget ${request.widgetId} in dashboard ${request.dashboardId}"
      ) {
        dashboardService.deleteWidget(request).map(toResponse)
      }
    }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "dashboard_id"),
      dashboardFilter.requireUserPermission(action = "edit", dashboardParamName = "dashboard_id"),
      dashboardFilter.requireTokenPermission(action = "edit", dashboardParamName = "dashboard_id")
    )
  )
    .put(s"/dashboards/:dashboard_id/widgets/resize") { request: ResizeWidgetsRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::ResizeWidgetsRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Widget,
        description = s"resize widgets in dashboard ${request.dashboardId}"
      ) {
        dashboardService.resizeWidgets(request).map(toResponse)
      }
    }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "id"),
      dashboardFilter.requireUserPermission(action = "edit", dashboardParamName = "id"),
      dashboardFilter.requireTokenPermission(action = "edit", dashboardParamName = "id")
    )
  )
    .put(s"/dashboards/:id") { request: UpdateSettingsRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::UpdateSettingsRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Dashboard,
        description = s"update settings of dashboard ${request.id}"
      ) {
        dashboardService.updateSettings(request).map(toResponse)
      }
    }
  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "id"),
      dashboardFilter.requireUserPermission(action = "edit", dashboardParamName = "id"),
      dashboardFilter.requireTokenPermission(action = "edit", dashboardParamName = "id")
    )
  )
    .post(s"/dashboards/:id/refresh_boost") { request: RefreshBoostRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::RefreshBoostRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Dashboard,
        description = s"refresh boost of dashboard ${request.id}"
      ) {
        dashboardService.refreshBoost(request).map(toResponse)
      }
    }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "id"),
      dashboardFilter.requireUserPermission(action = "edit", dashboardParamName = "id"),
      dashboardFilter.requireTokenPermission(action = "edit", dashboardParamName = "id")
    )
  )
    .post(s"/dashboards/:id/force_boost") { request: ForceBoostRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::ForceBoostRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Dashboard,
        description = s"force boost of dashboard ${request.id}"
      ) {
        dashboardService.forceBoost(request)
      }
    }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "dashboard_id"),
      dashboardFilter.requireUserPermission(action = "view", dashboardParamName = "dashboard_id"),
      dashboardFilter.requireTokenPermission(action = "view", dashboardParamName = "dashboard_id")
    )
  )
    .get(s"/dashboards/:dashboard_id/get_directory_id") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/dashboards/:dashboard_id/get_directory_id")
      UserActivityTracker(
        request = request,
        actionName = "get_directory_id",
        actionType = ActionType.View,
        resourceType = ResourceType.Dashboard,
        description = s"get dirId of dashboard"
      ) {
        val id = request.getLongParam("dashboard_id")
        dashboardService.getDirectoryId(id)
      }
    }

  filter[MustLoggedInFilter]
    .post(s"/dashboards/list_drill_through") { request: ListDrillThroughDashboardRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::ListDrillThroughDashboardRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Dashboard,
        description = s"drill through from dashboard ${request.from}"
      ) {
        drillThroughService.listDashboards(request)
      }
    }

  filter[MustLoggedInFilter]
    .post("/dashboards/drill_through/scan") {
      request: Request => {
        drillThroughService.scanAndUpdateDrillThroughFields()
      }
    }

  private def toResponse(success: Boolean): Map[String, Any] = {
    Map("success" -> success)
  }
}
