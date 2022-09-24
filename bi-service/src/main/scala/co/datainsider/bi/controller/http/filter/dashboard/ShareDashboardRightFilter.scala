package co.datainsider.bi.controller.http.filter.dashboard

import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.service.DashboardService
import datainsider.profiler.Profiler
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import datainsider.authorization.filters.DashboardAccessFilters
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.service.OrgAuthorizationClientService

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

@deprecated("unused")
case class ShareDashboardRightFilter @Inject() (
    dashboardService: DashboardService,
    authorizationService: OrgAuthorizationClientService
) extends DashboardAccessFilters.ShareAccessFilter {
  val action = "share"

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(
      DashboardFilter.isDashboardOwner(dashboardService),
      isUserPermitted
    )
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::ShareDashboardRightFilter (unused)] isUserPermitted") {
      val id: DashboardId = DashboardFilter.getDashboardId(request)
      authorizationService
        .isPermitted(
          request.currentOrganizationId.get,
          request.currentUser.username,
          PermissionProviders.dashboard.withDashboardId(id).share()
        )
        .map {
          case true  => Permitted()
          case false => UnPermitted("No permission to share this dashboard.")
        }
    }
  }
}
