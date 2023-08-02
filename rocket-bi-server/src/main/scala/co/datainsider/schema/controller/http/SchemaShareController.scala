package co.datainsider.schema.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.schema.domain.requests.{
  GetResourceSharingInfoRequest,
  MultiUpdateResourceSharingRequest,
  RevokeDatabasePermissionsRequest,
  ShareWithUserRequest
}
import co.datainsider.schema.service.ShareService
import com.twitter.finatra.http.Controller
import co.datainsider.license.domain.LicensePermission

import javax.inject.Inject

class SchemaShareController @Inject() (shareService: ShareService, permissionFilter: PermissionFilter)
    extends Controller {

  filter(permissionFilter.requireAll("database:view:[db_name]", LicensePermission.ViewData))
    .get("/databases/:db_name/share/list") { request: GetResourceSharingInfoRequest =>
      Profiler(s"/databases/:db_name/share/list") {
        shareService.getInfo(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.requireAll("database:share:[db_name]", LicensePermission.EditData))
    .post("/databases/:db_name/share") { request: ShareWithUserRequest =>
      Profiler(s"/databases/:db_name/share") {
        shareService.share(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.requireAll("database:share:[db_name]", LicensePermission.EditData))
    .put("/databases/:db_name/share/update") { request: MultiUpdateResourceSharingRequest =>
      Profiler(s"/databases/:db_name/share/update") {
        shareService.multiUpdate(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.requireAll("database:share:[db_name]", LicensePermission.EditData))
    .delete("/databases/:db_name/share/revoke") { request: RevokeDatabasePermissionsRequest =>
      Profiler(s"/databases/:db_name/share/revoke") {
        shareService.revokePermissions(request.currentOrganizationId.get, request)
      }
    }
}
