package datainsider.ingestion.controller.http

import com.twitter.finatra.http.Controller
import datainsider.client.filter.PermissionFilter
import datainsider.ingestion.controller.http.filter.SchemaFilter.{EditSchemaAccessFilter, ViewSchemaAccessFilter}
import datainsider.ingestion.controller.http.requests.{
  GetResourceSharingInfoRequest,
  MultiUpdateResourceSharingRequest,
  RevokeDatabasePermissionsRequest,
  ShareWithUserRequest
}
import datainsider.ingestion.service.ShareService
import datainsider.profiler.Profiler

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

class ShareController @Inject() (shareService: ShareService, permissionFilter: PermissionFilter) extends Controller {

  filter(permissionFilter.require("database:view:[db_name]"))
    .get("/databases/:db_name/share/list") { request: GetResourceSharingInfoRequest =>
      Profiler(s"[Share] ${this.getClass.getName}::GetResourceSharingInfoRequest") {
        shareService.getInfo(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.require("database:share:[db_name]"))
    .post("/databases/:db_name/share") { request: ShareWithUserRequest =>
      Profiler(s"[Share] ${this.getClass.getName}::ShareWithUserRequest") {
        shareService.share(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.require("database:share:[db_name]"))
    .put("/databases/:db_name/share/update") { request: MultiUpdateResourceSharingRequest =>
      Profiler(s"[Share] ${this.getClass.getName}::MultiUpdateResourceSharingRequest") {
        shareService.multiUpdate(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.require("database:share:[db_name]"))
    .delete("/databases/:db_name/share/revoke") { request: RevokeDatabasePermissionsRequest =>
      Profiler(s"[Share] ${this.getClass.getName}::RevokeDatabasePermissionsRequest") {
        shareService.revokePermissions(request.currentOrganizationId.get, request)
      }
    }
}
