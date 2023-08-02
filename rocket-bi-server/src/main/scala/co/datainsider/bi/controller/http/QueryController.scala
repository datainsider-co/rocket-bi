package co.datainsider.bi.controller.http

import co.datainsider.bi.controller.http.filter.{DashboardPermissionFilter, OrFilter}
import co.datainsider.bi.domain.request.{ChartRequest, QueryViewAsRequest, SqlQueryRequest}
import co.datainsider.bi.repository.FileStorage.FileType
import co.datainsider.bi.service.QueryService
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.license.domain.LicensePermission
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.finatra.http.Controller

import java.io.{File, FileInputStream}

class QueryController @Inject() (
    @Named("boosted") queryService: QueryService,
    permissionFilter: PermissionFilter,
    dashboardFilter: DashboardPermissionFilter
) extends Controller {

  post("/chart/query") { request: ChartRequest =>
    Profiler("/chart/query") {
      queryService.query(request)
    }
  }

  post("/query/sql") { request: SqlQueryRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::SqlQueryRequest") {
      queryService.query(request)
    }
  }

  filter(permissionFilter.requireAll("rls:view:*", LicensePermission.ViewData))
    .post("/chart/view_as") { request: QueryViewAsRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::QueryViewAsRequest") {
        queryService.query(request)
      }
    }

  filter(
    OrFilter(
      permissionFilter.requireValidator("query_analysis:download:*"),
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "dashboard_id"),
      dashboardFilter.requireUserPermission(action = "download", dashboardParamName = "dashboard_id"),
      dashboardFilter.requireTokenPermission(action = "download", dashboardParamName = "dashboard_id")
    )
  ).post("/query/csv") { request: ChartRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::exportAsCsv")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.View,
      resourceType = ResourceType.Widget,
      resourceId = request.chartId.map(_.toString).orNull,
      description = s"export data to csv"
    ) {
      queryService
        .exportToFile(request, FileType.Csv)
        .map(filePath => {
          val file = new File(filePath)
          val fileStream = new FileInputStream(file)
          response.ok.body(fileStream)
        })
    }
  }

  filter(
    OrFilter(
      permissionFilter.requireValidator("query_analysis:download:*"),
      dashboardFilter.requireDirectoryOwner(dashboardParamName = "dashboard_id"),
      dashboardFilter.requireUserPermission(action = "download", dashboardParamName = "dashboard_id"),
      dashboardFilter.requireTokenPermission(action = "download", dashboardParamName = "dashboard_id")
    )
  ).post("/query/xlsx") { request: ChartRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::exportAsExcel")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.View,
      resourceType = ResourceType.Widget,
      resourceId = request.chartId.map(_.toString).orNull,
      description = s"export data to excel"
    ) {
      queryService
        .exportToFile(request, FileType.Excel)
        .map(filePath => {
          val file = new File(filePath)
          val fileStream = new FileInputStream(file)
          response.ok.body(fileStream)
        })
    }
  }
}
