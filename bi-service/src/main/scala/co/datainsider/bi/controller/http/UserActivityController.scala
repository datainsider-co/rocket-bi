package co.datainsider.bi.controller.http

import co.datainsider.bi.controller.http.filter.UserActivityTokenFilter
import co.datainsider.bi.domain.request.ListUserActivitiesRequest
import co.datainsider.bi.service.UserActivityService
import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import datainsider.client.filter.PermissionFilter
import datainsider.profiler.Profiler
import datainsider.tracker.{ActionType, ResourceType, TrackUserActivitiesRequest}

import scala.concurrent.ExecutionContext.Implicits.global

class UserActivityController @Inject() (
    userActivityService: UserActivityService,
    permissionFilter: PermissionFilter
) extends Controller {

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

  filter[UserActivityTokenFilter]
    .post("/activities") { request: TrackUserActivitiesRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::TrackUserActivitiesRequest") {
        userActivityService.track(request).map(success => Map("success" -> success))
      }
    }

}
