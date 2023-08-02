package co.datainsider.bi.controller.http

import co.datainsider.bi.controller.http.filter._
import co.datainsider.bi.domain.Directory.{MyData, Shared}
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain.request._
import co.datainsider.bi.service.{DashboardService, DirectoryService, DrillThroughService, RecentDirectoryService}
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import co.datainsider.caas.user_profile.controller.http.filter.MustLoggedInFilter
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.util.Future
import datainsider.client.exception.UnsupportedError

class DashboardController @Inject() (
    dashboardService: DashboardService,
    directoryService: DirectoryService,
    drillThroughService: DrillThroughService,
    dashboardFilter: DashboardPermissionFilter,
    directoryFilter: DirectoryPermissionFilter,
    recentDirectoryService: RecentDirectoryService
) extends Controller {

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "id"),
      dashboardFilter.requireUserPermission(action = "view", dashboardParamName = "id"),
      dashboardFilter.requireTokenPermission(action = "view", dashboardParamName = "id")
    )
  )
    .get(s"/dashboards/:id") { request: GetDashboardRequest =>
      Profiler("/dashboards/:id GET")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Dashboard,
        resourceId = request.id.toString,
        description = s"view dashboard ${request.id}"
      ) {
        val orgId = request.getOrganizationId()
        for {
          directoryId <- dashboardService.getDirectoryId(orgId, request.id)
          dashboard <- dashboardService.get(request)
          _ <- recentDirectoryService.addOrUpdate(orgId, request.currentUsername, directoryId)
        } yield dashboard
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
      Profiler(s"/dashboards/create")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Dashboard,
        resourceId = null,
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

  private def getRootId(request: Request): Future[DirectoryId] = {
    directoryService.getRootDir(GetRootDirectoryRequest(request)).map(_.id)
  }

  filter(
    OrFilter(
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "id"),
      dashboardFilter.requireUserPermission(action = "edit", dashboardParamName = "id"),
      dashboardFilter.requireTokenPermission(action = "edit", dashboardParamName = "id")
    )
  ).put("/dashboards/:id/rename") { request: RenameDashboardRequest =>
    Profiler("/dashboards/:id/rename")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.Dashboard,
      resourceId = request.id.toString,
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
  ).put(s"/dashboards/:id/main_date_filter/edit") { request: UpdateMainDateFilterRequest =>
    Profiler(s"/dashboards/:id/main_date_filter/edit")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.Dashboard,
      resourceId = request.id.toString,
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
  ).delete(s"/dashboards/:id") { request: DeleteDashboardRequest =>
    Profiler(s"/dashboards/:id DELETE")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Delete,
      resourceType = ResourceType.Dashboard,
      resourceId = request.id.toString,
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
      Profiler(s"/dashboards/:id/share")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Dashboard,
        resourceId = request.id.toString,
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
      Profiler(s"/dashboards/:dashboard_id/widgets/:widget_id")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.Widget,
        resourceId = request.widgetId.toString,
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
  ).post(s"/dashboards/:dashboard_id/widgets/create") { request: CreateWidgetRequest =>
    Profiler(s"/dashboards/:dashboard_id/widgets/create")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Create,
      resourceType = ResourceType.Widget,
      resourceId = null,
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
      Profiler(s"/dashboards/:dashboard_id/widgets/:widget_id/edit")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Widget,
        resourceId = request.widgetId.toString,
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
  ).delete(s"/dashboards/:dashboard_id/widgets/:widget_id") { request: DeleteWidgetRequest =>
    Profiler(s"/dashboards/:dashboard_id/widgets/:widget_id DELETE")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Delete,
      resourceType = ResourceType.Widget,
      resourceId = request.widgetId.toString,
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
  ).put(s"/dashboards/:dashboard_id/widgets/resize") { request: ResizeWidgetsRequest =>
    Profiler(s"/dashboards/:dashboard_id/widgets/resize")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.Dashboard,
      resourceId = request.dashboardId.toString,
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
  ).put(s"/dashboards/:id") { request: UpdateSettingsRequest =>
    Profiler(s"/dashboards/:id PUT")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.Dashboard,
      resourceId = request.id.toString,
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
  ).post(s"/dashboards/:id/refresh_boost") { request: RefreshBoostRequest =>
    Profiler(s"/dashboards/:id/refresh_boost")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.Dashboard,
      resourceId = request.id.toString,
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
  ).post(s"/dashboards/:id/force_boost") { request: ForceBoostRequest =>
    Profiler(s"/dashboards/:id/force_boost")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.Dashboard,
      resourceId = request.id.toString,
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
  ).get(s"/dashboards/:dashboard_id/get_directory_id") { request: Request =>
    Profiler(s"/dashboards/:dashboard_id/get_directory_id") {
      val orgId = request.getOrganizationId()
      val id = request.getLongParam("dashboard_id")
      dashboardService.getDirectoryId(orgId, id)
    }
  }

  filter[MustLoggedInFilter]
    .post(s"/dashboards/list_drill_through") { request: ListDrillThroughDashboardRequest =>
      Profiler(s"/dashboards/list_drill_through") {
        drillThroughService.listDashboards(request)
      }
    }

  filter[MustLoggedInFilter]
    .post("/dashboards/drill_through/scan") { request: Request =>
      Profiler(s"/dashboards/drill_through/scan") {
        drillThroughService.scanAndUpdateDrillThroughFields()
      }
    }

  private def toResponse(success: Boolean): Map[String, Any] = {
    Map("success" -> success)
  }
}
