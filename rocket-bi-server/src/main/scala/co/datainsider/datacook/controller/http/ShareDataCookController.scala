package co.datainsider.datacook.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.datacook.domain.request.share._
import co.datainsider.datacook.service.ShareETLService
import com.twitter.finatra.http.Controller
import co.datainsider.license.domain.LicensePermission

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
      Profiler("/data_cook/:id/share") {
        shareService.share(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.requireAll("etl:share:[id]", LicensePermission.EditData))
    .put("/data_cook/:id/share/update") { request: UpdateShareRequest =>
      Profiler("/data_cook/:id/share/update") {
        shareService.update(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.requireAll("etl:share:[id]", LicensePermission.EditData))
    .delete("/data_cook/:id/share/revoke") { request: RevokeShareRequest =>
      Profiler("/data_cook/:id/share/revoke") {
        shareService.revoke(request.currentOrganizationId.get, request)
      }
    }
}
