package co.datainsider.share.controller

import co.datainsider.bi.controller.http.filter.ShareTokenParser
import co.datainsider.bi.domain.DirectoryType
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.MustLoggedInFilter
import co.datainsider.share.controller.request._
import co.datainsider.share.service.{DashboardPermissionService, DirectoryPermissionService, PermissionTokenService}
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

class PermissionTokenController @Inject() (
    permissionTokenService: PermissionTokenService,
    directoryPermissionService: DirectoryPermissionService,
    dashboardPermissionService: DashboardPermissionService
) extends Controller {

  filter[ShareTokenParser]
    .get(s"/permission_tokens/:token_id") { request: Request =>
      Profiler("/permission_tokens/:token_id GET") {
        {
          val tokenId = request.getParam("token_id")
          permissionTokenService.getToken(tokenId)
        }
      }
    }

  filter[MustLoggedInFilter]
    .post(s"/permission_tokens") { request: GetOrCreatePermissionTokenRequest =>
      Profiler("/permission_tokens") {
        permissionTokenService.getOrCreateToken(request)
      }
    }

  filter[ShareTokenParser]
    .post(s"/permission_tokens/:token_id/action_permitted") { request: CheckTokenActionPermittedRequest =>
      Profiler("/permission_tokens/:token_id/action_permitted") {
        DirectoryType.withName(request.resourceType) match {
          case DirectoryType.Directory =>
            directoryPermissionService.isPermitted(
              request.tokenId,
              request.getOrganizationId(),
              request.resourceId.toLong,
              request.actions
            )
          case DirectoryType.Dashboard | DirectoryType.Queries =>
            dashboardPermissionService.isPermitted(
              request.tokenId,
              request.getOrganizationId(),
              request.resourceId.toLong,
              request.actions
            )
          case DirectoryType.RetentionAnalysis | DirectoryType.FunnelAnalysis | DirectoryType.EventAnalysis |
              DirectoryType.PathExplorer =>
            directoryPermissionService.isPermitted(
              request.tokenId,
              request.getOrganizationId(),
              request.resourceId.toLong,
              request.actions
            )
        }
      }
    }

  filter[ShareTokenParser]
    .post(s"/permission_tokens/:token_id/permitted") { request: CheckTokenPermittedRequest =>
      Profiler("/permission_tokens/:token_id/permitted") {
        permissionTokenService.isPermitted(request.tokenId, request.permissions)
      }
    }

  filter[ShareTokenParser]
    .post(s"/permission_tokens/:token_id/permitted_all") { request: CheckTokenPermittedAllRequest =>
      Profiler("/permission_tokens/:token_id/permitted_all") {
        permissionTokenService.isPermittedAll(
          request.tokenId,
          request.permissions
        )
      }
    }

  filter[EditPermissionTokenRightFilter]
    .put(s"/permission_tokens/:token_id") { request: UpdatePermissionTokenRequest =>
      Profiler("/permission_tokens/:token_id POST") {
        permissionTokenService.updatePermission(
          request.tokenId,
          request.permissions
        )
      }
    }

  filter[DeletePermissionTokenRightFilter]
    .delete(s"/permission_tokens/:token_id") { request: Request =>
      Profiler("/permission_tokens/:token_id DELETE") {
        val tokenId = request.getParam("token_id")
        permissionTokenService.deleteToken(tokenId)
      }
    }
}
