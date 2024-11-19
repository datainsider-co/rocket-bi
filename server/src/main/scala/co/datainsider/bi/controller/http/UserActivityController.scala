package co.datainsider.bi.controller.http

import co.datainsider.bi.controller.http.filter.UserActivityTokenFilter
import co.datainsider.bi.domain.request.ListUserActivitiesRequest
import co.datainsider.bi.service.UserActivityService
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import co.datainsider.license.domain.LicensePermission
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, TrackUserActivitiesRequest}

class UserActivityController @Inject() (
    userActivityService: UserActivityService,
    permissionFilter: PermissionFilter
) extends Controller {

  filter(permissionFilter.requireAll("user_activity:view:*", LicensePermission.ViewData))
    .post("/query/activities") { request: ListUserActivitiesRequest =>
      Profiler(s"/query/activities") {
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
      Profiler(s"/activities POST") {
        userActivityService.track(request).map(success => Map("success" -> success))
      }
    }

}
