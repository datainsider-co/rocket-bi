package co.datainsider.bi.controller.http.filter.dashboard

import co.datainsider.bi.controller.http.filter.dashboard.DashboardFilter.getDashboardId
import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.service.DashboardService
import datainsider.profiler.Profiler
import co.datainsider.share.service.DashboardPermissionService
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.filters.DashboardAccessFilters
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

import javax.inject.{Inject, Named}
import scala.concurrent.ExecutionContext.Implicits.global

case class CopyDashboardRightFilter @Inject() (
    dashboardService: DashboardService,
    dashboardPermissionService: DashboardPermissionService,
    @Named("token_header_key") tokenKey: String
) extends DashboardAccessFilters.CopyAccessFilter {
  val action = "copy"

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(
      DashboardFilter.isDashboardOwner(dashboardService),
      isUserPermitted,
      isTokenPermitted
    )
  }

  private def isTokenPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::CopyDashboardRightFilter] isTokenPermitted") {
      if (request.isAuthenticated) {
        Option(request.headerMap.getOrElse(tokenKey, null)) match {
          case Some(tokenId) =>
            val dashboardId: DashboardId = getDashboardId(request)
            val permissionResult = dashboardPermissionService
              .isPermitted(
                tokenId,
                request.currentOrganizationId.get,
                dashboardId,
                action
              )
              .map {
                case true  => Permitted()
                case false => UnPermitted("Token no permission to copy/duplicate this dashboard.")
              }
            permissionResult
          case None => Future.value(UnPermitted("Token is required to copy/duplicate this dashboard."))
        }
      } else {
        Future.value(UnPermitted("Login is required to copy/duplicate this dashboard."))
      }
    }
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::CopyDashboardRightFilter] isUserPermitted") {
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
            case false => UnPermitted("No permission to copy/duplicate this dashboard.")
          }
        permissionResult
      } else {
        Future.value(UnPermitted("Login is required to copy/duplicate this dashboard."))
      }
    }
  }
}
