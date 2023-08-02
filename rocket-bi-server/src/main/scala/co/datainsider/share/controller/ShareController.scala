package co.datainsider.share.controller

import co.datainsider.bi.domain.DirectoryType
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.share.controller.filter.ShareAccessFilters
import co.datainsider.share.controller.request._
import co.datainsider.share.service.{DashboardPermissionService, DirectoryPermissionService, ShareService}
import com.google.inject.{Inject, Singleton}
import com.twitter.finatra.http.Controller

@Singleton
class ShareController @Inject() (
    shareService: ShareService,
    directoryPermissionService: DirectoryPermissionService,
    dashboardPermissionService: DashboardPermissionService
) extends Controller {

  filter[ShareAccessFilters.ViewAccessFilter]
    .get(s"/share/:resource_type/:resource_id") { request: GetResourceSharingInfoRequest =>
      Profiler("[Controller::ShareController] GET /share/:resource_type/:resource_id") {
        shareService.getInfo(request.getOrganizationId(), request)
      }
    }

  filter[ShareAccessFilters.EditAccessFilter]
    .post(s"/share/:resource_type/:resource_id") { request: ShareWithUserRequest =>
      Profiler("[Controller::ShareController] POST /share/:resource_type/:resource_id") {
        shareService.share(request.getOrganizationId(), request)
      }
    }

  filter[ShareAccessFilters.EditAccessFilter]
    .put(s"/share/:resource_type/:resource_id/edit") { request: MultiUpdateResourceSharingRequest =>
      Profiler("[Controller::ShareController] PUT /share/:resource_type/:resource_id/edit") {
        shareService.multiUpdate(request.getOrganizationId(), request)
      }
    }

  filter[ShareAccessFilters.DeleteAccessFilter]
    .delete(s"/share/:resource_type/:resource_id/revoke") { request: RevokeShareRequest =>
      Profiler("[Controller::ShareController] DELETE /share/:resource_type/:resource_id/revoke") {
        shareService.revoke(request.getOrganizationId(), request.resourceType, request.resourceId, request.usernames)
      }
    }

  filter[ShareAccessFilters.ViewAccessFilter]
    .get(s"/share/:resource_type/:resource_id/anyone") { request: GetShareAnyoneInfoRequest =>
      Profiler("[Controller::ShareController] GET /share/:resource_type/:resource_id/anyone") {
        shareService.getInfo(request.getOrganizationId(), request)
      }
    }

  filter[ShareAccessFilters.EditAccessFilter]
    .post(s"/share/:resource_type/:resource_id/anyone") { request: ShareAnyoneRequest =>
      Profiler("[Controller::ShareController] POST /share/:resource_type/:resource_id/anyone") {
        shareService.share(request.getOrganizationId(), request)
      }
    }

  filter[ShareAccessFilters.EditAccessFilter]
    .put(s"/share/:resource_type/:resource_id/anyone") { request: UpdateShareAnyoneRequest =>
      Profiler("[Controller::ShareController] PUT /share/:resource_type/:resource_id/anyone") {
        shareService.update(request.getOrganizationId(), request)
      }
    }

  filter[ShareAccessFilters.DeleteAccessFilter]
    .delete(s"/share/:resource_type/:resource_id/anyone/revoke") { request: RevokeShareAnyoneRequest =>
      Profiler("[Controller::ShareController] DELETE /share/:resource_type/:resource_id/anyone/revoke") {
        shareService.revokeShareAnyone(request.getOrganizationId(), request.resourceType, request.resourceId)
      }
    }

  post(s"/share/:resource_type/:resource_id/action_permitted") { request: CheckActionPermittedRequest =>
    {
      Profiler("[Controller::ShareController] DELETE /share/:resource_type/:resource_id/action_permitted") {
        val orgId = request.getOrganizationId()
        val username = request.currentUsername
        DirectoryType.withName(request.resourceType) match {
          case DirectoryType.Directory =>
            directoryPermissionService.isPermitted(orgId, username, request.resourceId.toLong, request.actions)
          case DirectoryType.Dashboard | DirectoryType.Queries =>
            dashboardPermissionService.isPermitted(orgId, username, request.resourceId.toLong, request.actions)
          case DirectoryType.RetentionAnalysis | DirectoryType.FunnelAnalysis | DirectoryType.EventAnalysis |
              DirectoryType.PathExplorer =>
            directoryPermissionService.isPermitted(orgId, username, request.resourceId.toLong, request.actions)
        }
      }
    }
  }
}
