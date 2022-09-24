package co.datainsider.bi.controller.http.filter.dashboard

import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.service.DashboardService
import datainsider.profiler.Profiler
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

import scala.concurrent.ExecutionContext.Implicits.global

object DashboardFilter {
  def getDashboardId(request: Request): DashboardId = {
    Profiler("[Filter::BaseDashboardFilter] getDashboardId") {
      val dashboardId: DashboardId = request.getLongParam("id", -1L) match {
        case id if id >= 0L => id
        case _              => request.getLongParam("dashboard_id")
      }
      dashboardId
    }
  }

  def isDashboardOwner(dashboardService: DashboardService): AccessValidator = { request =>
    Profiler("[Filter::BaseDashboardFilter] isDashboardOwner") {
      if (request.isAuthenticated) {
        val username: String = request.currentUser.username
        val organizationId = request.currentOrganizationId match {
          case Some(value) => value
          case None        => throw UnAuthorizedError("Not found organization id")
        }
        val permissionResults: Future[PermissionResult] = dashboardService
          .get(organizationId, getDashboardId(request))
          .map(dashboard => dashboard.ownerId.equals(username))
          .map {
            case true  => Permitted()
            case false => UnPermitted("You are not the owner of this dashboard.")
          }
        permissionResults
      } else {
        Future.value(UnPermitted("Login is required for check owner of this dashboard"))
      }
    }
  }
}
