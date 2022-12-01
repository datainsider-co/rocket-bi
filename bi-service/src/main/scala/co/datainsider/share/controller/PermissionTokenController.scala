package co.datainsider.share.controller

import co.datainsider.bi.domain.DirectoryType
import datainsider.profiler.Profiler
import co.datainsider.share.controller.request._
import co.datainsider.share.service.{DashboardPermissionService, DirectoryPermissionService, PermissionTokenService}
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.util.Future
import datainsider.client.exception.UnsupportedError
import datainsider.client.filter.MustLoggedInFilter

import scala.concurrent.ExecutionContext.Implicits.global

class PermissionTokenController @Inject() (
    permissionTokenService: PermissionTokenService,
    directoryPermissionService: DirectoryPermissionService,
    dashboardPermissionService: DashboardPermissionService
) extends Controller {

  val apiPath = "/permission_tokens"

  get(s"$apiPath/:token_id") { request: Request =>
    Profiler("[Controller::PermissionTokenController] GET /permission_tokens/:token_id") {
      {
        val tokenId = request.getParam("token_id")
        permissionTokenService.getToken(tokenId)
      }
    }
  }

  filter[MustLoggedInFilter]
    .post(s"$apiPath") { request: GetOrCreatePermissionTokenRequest =>
      Profiler("[Controller::PermissionTokenController] POST /permission_tokens") {
        permissionTokenService.getOrCreateToken(request)
      }
    }

  post(s"$apiPath/:token_id/action_permitted") { request: CheckTokenActionPermittedRequest =>
    {
      Profiler("[Controller::PermissionTokenController] POST /permission_tokens/:token_id/action_permitted") {
        DirectoryType.withName(request.resourceType) match {
          case DirectoryType.Directory =>
            directoryPermissionService.isPermitted(request.tokenId, request.getOrganizationId(), request.resourceId.toLong, request.actions)
          case DirectoryType.Dashboard | DirectoryType.Queries =>
            dashboardPermissionService.isPermitted(request.tokenId, request.getOrganizationId(), request.resourceId.toLong, request.actions)
          case DirectoryType.RetentionAnalysis | DirectoryType.FunnelAnalysis | DirectoryType.EventAnalysis | DirectoryType.PathExplorer =>
            directoryPermissionService.isPermitted(request.tokenId, request.getOrganizationId(), request.resourceId.toLong, request.actions)        }
      }
    }
  }

  post(s"$apiPath/:token_id/permitted") { request: CheckTokenPermittedRequest =>
    Profiler("[Controller::PermissionTokenController] POST /permission_tokens/:token_id/permitted") {
      permissionTokenService.isPermitted(request.tokenId, request.permissions)
    }
  }

  post(s"$apiPath/:token_id/permitted_all") { request: CheckTokenPermittedAllRequest =>
    Profiler("[Controller::PermissionTokenController] POST /permission_tokens/:token_id/permitted_all") {
      {
        permissionTokenService.isPermittedAll(
          request.tokenId,
          request.permissions
        )
      }
    }
  }

  filter[EditPermissionTokenRightFilter]
    .put(s"$apiPath/:token_id") { request: UpdatePermissionTokenRequest =>
      Profiler("[Controller::PermissionTokenController] PUT /permission_tokens/:token_id") {
        permissionTokenService.updatePermission(
          request.tokenId,
          request.permissions
        )
      }
    }

  filter[DeletePermissionTokenRightFilter]
    .delete(s"$apiPath/:token_id") { request: Request =>
      Profiler("[Controller::PermissionTokenController] DELETE /permission_tokens/:token_id") {
        {
          val tokenId = request.getParam("token_id")
          permissionTokenService.deleteToken(tokenId)
        }
      }
    }
}
