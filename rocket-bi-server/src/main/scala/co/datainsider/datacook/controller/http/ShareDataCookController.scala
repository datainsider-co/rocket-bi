package co.datainsider.datacook.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.datacook.domain.request.share._
import co.datainsider.datacook.service.ShareETLService
import co.datainsider.license.domain.LicensePermission
import com.twitter.finatra.http.Controller

import javax.inject.{Inject, Singleton}

@Singleton
class ShareDataCookController @Inject()(shareService: ShareETLService, permissionFilter: PermissionFilter)
    extends Controller {

  filter(permissionFilter.requireAll("etl:view:[id]", LicensePermission.ViewData))
    .get("/data_cook/:id/share/list") { request: ListSharedUserRequest =>
      Profiler("/data_cook/:id/share/list") {
        shareService.listSharedUsers(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.requireAll("etl:share:[id]", LicensePermission.EditData))
    .post("/data_cook/:id/share") { request: ShareEtlToUsersRequest =>
      Profiler("/data_cook/:id/share")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.DataCook,
        resourceId = String.valueOf(request.id),
        description = s"share data cook ${request.id}"
      ) {
        shareService.share(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.requireAll("etl:share:[id]", LicensePermission.EditData))
    .put("/data_cook/:id/share/update") { request: UpdateShareRequest =>
      Profiler("/data_cook/:id/share/update")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.DataCook,
        resourceId = String.valueOf(request.id),
        description = s"update share data cook ${request.id}"
      ) {
        shareService.update(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.requireAll("etl:share:[id]", LicensePermission.EditData))
    .delete("/data_cook/:id/share/revoke") { request: RevokeShareRequest =>
      Profiler("/data_cook/:id/share/revoke")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.DataCook,
        resourceId = String.valueOf(request.id),
        description = s"revoke share data cook ${request.id}"
      ) {
        shareService.revoke(request.currentOrganizationId.get, request)
      }
    }
}
