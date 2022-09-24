package co.datainsider.bi.controller.http.filter.widget

import co.datainsider.bi.controller.http.filter.dashboard.DashboardFilter.getDashboardId
import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.service.DashboardService
import co.datainsider.share.service.DashboardPermissionService
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.filters.WidgetAccessFilters
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

import javax.inject.{Inject, Named}

@deprecated("Use PermissionFilter instead", since = "2022-07-15")
case class CreateWidgetRightFilter @Inject() (
    dashboardPermissionService: DashboardPermissionService,
    dashboardService: DashboardService,
    @Named("token_header_key") tokenKey: String
) extends WidgetAccessFilters.CreateAccessFilter {
  val action = "create"

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isTokenPermitted, isUserPermitted)
  }

//  private def isOwnerDashboard(request: Request): Future[PermissionResult] = {
//    if (request.isAuthenticated) {
//      val dashboardId: DashboardId = getDashboardId(request)
//      val permissionResult: Future[PermissionResult] = dashboardService
//        .get(dashboardId)
//        .map(dashboard => dashboard.ownerId.equals(request.currentUsername))
//        .map {
//          case true  => Permitted()
//          case false => UnPermitted("You are not the owner of this dashboard")
//        }
//      permissionResult
//    } else {
//      Future.value(UnPermitted("Login is required for check owner of this dashboard"))
//    }
//  }

  private def isTokenPermitted(request: Request): Future[PermissionResult] = {
    Option(request.headerMap.getOrElse(tokenKey, null)) match {
      case Some(tokenId) =>
        val dashboardId: DashboardId = getDashboardId(request)
        val permissionResult: Future[PermissionResult] = dashboardPermissionService
          .isPermitted(
            tokenId,
            request.currentOrganizationId.get,
            dashboardId,
            action
          )
          .map {
            case true  => Permitted()
            case false => UnPermitted("Token no permission to create this widget.")
          }
        permissionResult
      case None => Future.value(UnPermitted("Token is required to create this widget"))
    }
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    if (request.isAuthenticated) {
      val dashboardId: DashboardId = getDashboardId(request)
      val permissionResult: Future[PermissionResult] = dashboardPermissionService
        .isPermitted(
          request.currentOrganizationId.get,
          request.currentUser.username,
          dashboardId,
          action
        )
        .map {
          case true  => Permitted()
          case false => UnPermitted("No permission to create this widget.")
        }
      permissionResult
    } else {
      Future.value(UnPermitted("Login is required to create this widget"))
    }
  }
}
