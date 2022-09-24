package co.datainsider.share.controller

import co.datainsider.bi.domain.DirectoryType
import datainsider.profiler.Profiler
import co.datainsider.share.controller.filter.ShareContext.ShareContextSyntax
import co.datainsider.share.controller.filter.{ShareAccessFilters, UserNonSharingFilter}
import co.datainsider.share.controller.request._
import co.datainsider.share.service.{DashboardPermissionService, DirectoryPermissionService, ShareService}
import com.google.inject.{Inject, Singleton}
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.util.Future
import datainsider.client.exception.UnsupportedError
import datainsider.client.filter.UserContext.UserContextSyntax

import scala.concurrent.ExecutionContext.Implicits.global

@Singleton
class ShareController @Inject() (
    shareService: ShareService,
    directoryPermissionService: DirectoryPermissionService,
    dashboardPermissionService: DashboardPermissionService
) extends Controller {
  private val apiPath = "/share/:resource_type/:resource_id"

  filter[ShareAccessFilters.ViewAccessFilter]
    .get(s"$apiPath") { request: GetResourceSharingInfoRequest =>
      Profiler("[Controller::ShareController] GET /share/:resource_type/:resource_id") {
        shareService.getInfo(request.currentOrganizationId.get, request)
      }
    }

  filter[ShareAccessFilters.EditAccessFilter]
    .post(s"${apiPath}") { request: ShareWithUserRequest =>
      Profiler("[Controller::ShareController] POST /share/:resource_type/:resource_id") {
        shareService.share(request.currentOrganizationId.get, request)
      }
    }

  filter[ShareAccessFilters.EditAccessFilter]
    .put(s"$apiPath/edit") { request: MultiUpdateResourceSharingRequest =>
      Profiler("[Controller::ShareController] PUT /share/:resource_type/:resource_id/edit") {
        shareService.multiUpdate(request.currentOrganizationId.get, request)
      }
    }

  filter[ShareAccessFilters.DeleteAccessFilter]
    .delete(s"$apiPath/revoke") { request: RevokeShareRequest =>
      Profiler("[Controller::ShareController] DELETE /share/:resource_type/:resource_id/revoke") {
        shareService.revoke(request.currentOrganizationId.get, request)
      }
    }

  filter[ShareAccessFilters.ViewAccessFilter]
    .get(s"$apiPath/anyone") { request: GetShareAnyoneInfoRequest =>
      Profiler("[Controller::ShareController] GET /share/:resource_type/:resource_id/anyone") {
        shareService.getInfo(request.currentOrganizationId.get, request)
      }
    }

  filter[ShareAccessFilters.EditAccessFilter]
    .post(s"$apiPath/anyone") { request: ShareAnyoneRequest =>
      Profiler("[Controller::ShareController] POST /share/:resource_type/:resource_id/anyone") {
        shareService.share(request.currentOrganizationId.get, request)
      }
    }

  filter[ShareAccessFilters.EditAccessFilter]
    .put(s"$apiPath/anyone") { request: UpdateShareAnyoneRequest =>
      Profiler("[Controller::ShareController] PUT /share/:resource_type/:resource_id/anyone") {
        shareService.update(request.currentOrganizationId.get, request)
      }
    }

  filter[ShareAccessFilters.DeleteAccessFilter]
    .delete(s"$apiPath/anyone/revoke") { request: RevokeShareAnyoneRequest =>
      Profiler("[Controller::ShareController] DELETE /share/:resource_type/:resource_id/anyone/revoke") {
        shareService.revoke(request.currentOrganizationId.get, request)
      }
    }

  post(s"$apiPath/action_permitted") { request: CheckActionPermittedRequest =>
    {
      Profiler("[Controller::ShareController] DELETE /share/:resource_type/:resource_id/action_permitted") {
        val orgId = request.currentOrganizationId.get
        val username = request.currentUsername
        DirectoryType.withName(request.resourceType) match {
          case DirectoryType.Directory =>
            directoryPermissionService.isPermitted(orgId, username, request.resourceId.toLong, request.actions)
          case DirectoryType.Dashboard | DirectoryType.Queries =>
            dashboardPermissionService.isPermitted(orgId, username, request.resourceId.toLong, request.actions)
          case _ => Future.exception(UnsupportedError(s"unsupported check action of type ${request.resourceType}"))
        }
      }
    }
  }
}
