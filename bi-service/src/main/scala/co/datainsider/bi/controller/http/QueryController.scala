package co.datainsider.bi.controller.http

import co.datainsider.bi.controller.http.filter.UserActivityTracker
import co.datainsider.bi.domain.query.event.{ActionType, ResourceType}
import co.datainsider.bi.domain.request.{ChartRequest, ListUserActivitiesRequest, SqlQueryRequest, QueryViewAsRequest}
import co.datainsider.bi.service.{QueryService, UserActivityService}
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.finatra.http.Controller
import datainsider.client.filter.{MustLoggedInFilter, PermissionFilter}
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

class QueryController @Inject() (
    @Named("boosted") queryService: QueryService,
    userActivityService: UserActivityService,
    permissionFilter: PermissionFilter
) extends Controller {

  post("/chart/query") { request: ChartRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::ChartRequest")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.View,
      resourceType = ResourceType.Widget,
      description = s"query chart"
    ) {
      queryService.query(request)
    }
  }

  filter[MustLoggedInFilter].post("/query/sql") { request: SqlQueryRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::SqlQueryRequest")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.View,
      resourceType = ResourceType.Widget,
      description = s"query sql"
    ) {
      queryService.query(request)
    }
  }

  filter(permissionFilter.require("user_activity:view:*"))
    .post("/query/activities") { request: ListUserActivitiesRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::ListUserActivitiesRequest") {
        val organizationId = request.currentOrganizationId.get

        userActivityService.list(
          orgId = organizationId,
          startTime = request.startTime,
          endTime = request.endTime,
          usernames = request.usernames,
          actionNames = request.actionNames,
          actionTypes = request.actionTypes.map(ActionType.withName),
          resourceTypes = request.resourceTypes.map(ResourceType.withName),
          statusCodes = Seq(200),
          from = request.from,
          size = request.size
        )
      }
    }

  filter(permissionFilter.require("rls:view:*"))
    .post("/chart/view_as") { request: QueryViewAsRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::QueryViewAsRequest") {
        queryService.query(request)
      }
    }

  post("/query/csv") { request: ChartRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::exportAsCsv") {
      queryService.exportAsCsv(request)
    }
  }
}
