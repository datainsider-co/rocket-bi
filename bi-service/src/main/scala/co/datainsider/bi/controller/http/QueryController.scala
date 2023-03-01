package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.request.{ChartRequest, QueryViewAsRequest, SqlQueryRequest}
import co.datainsider.bi.service.QueryService
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.finatra.http.Controller
import datainsider.client.filter.{MustLoggedInFilter, PermissionFilter}
import datainsider.profiler.Profiler
import datainsider.tracker.{ActionType, ResourceType, UserActivityTracker}

import scala.concurrent.ExecutionContext.Implicits.global

class QueryController @Inject() (
    @Named("boosted") queryService: QueryService,
    permissionFilter: PermissionFilter
) extends Controller {

  post("/chart/query") { request: ChartRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::ChartRequest") {
      queryService.query(request)
    }
  }

  filter[MustLoggedInFilter].post("/query/sql") { request: SqlQueryRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::SqlQueryRequest") {
      queryService.query(request)
    }
  }

  filter(permissionFilter.require("rls:view:*"))
    .post("/chart/view_as") { request: QueryViewAsRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::QueryViewAsRequest") {
        queryService.query(request)
      }
    }

  post("/query/csv") { request: ChartRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::exportAsCsv")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.View,
      resourceType = ResourceType.Widget,
      resourceId = request.chartId.map(_.toString).orNull,
      description = s"export data to csv"
    ) {
      queryService.exportAsCsv(request)
    }
  }
}
