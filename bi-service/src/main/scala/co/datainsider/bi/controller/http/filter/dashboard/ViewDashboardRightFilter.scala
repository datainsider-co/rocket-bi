package co.datainsider.bi.controller.http.filter.dashboard

import co.datainsider.bi.controller.http.filter.AnonymousLoginResponse.anonymousUserProfile
import co.datainsider.bi.controller.http.filter.dashboard.DashboardFilter.getDashboardId
import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.domain.DirectoryType
import co.datainsider.bi.service.DashboardService
import co.datainsider.bi.util.ZConfig
import datainsider.profiler.Profiler
import co.datainsider.share.service.{DashboardPermissionService, ShareService}
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.filters.DashboardAccessFilters
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

import javax.inject.{Inject, Named}
import scala.concurrent.ExecutionContext.Implicits.global

case class ViewDashboardRightFilter @Inject() (
    dashboardService: DashboardService,
    shareService: ShareService,
    dashboardPermissionService: DashboardPermissionService,
    @Named("token_header_key") tokenKey: String
) extends DashboardAccessFilters.ViewAccessFilter {
  val action = "view"

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(
      DashboardFilter.isDashboardOwner(dashboardService),
      isTokenPermitted,
      isUserPermitted
    )
  }

  def inviteIfLoggedIn(request: Request, tokenId: String): Future[Unit] = {
    Profiler("[Filter::ViewDashboardRightFilter] inviteIfLogged") {
      if (isRealUser(request)) {
        shareService
          .invite(
            request.currentOrganizationId.get,
            DirectoryType.Dashboard.toString,
            DashboardFilter.getDashboardId(request).toString,
            Seq(request.currentUsername),
            tokenId
          )
          .unit
      } else {
        Future.Unit
      }
    }
  }

  def isRealUser(request: Request): Boolean = {
    request.isAuthenticated && (request.currentUsername != anonymousUserProfile.username)
  }

  private def isTokenPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::ViewDashboardRightFilter] isTokenPermitted") {
      Option(request.headerMap.getOrElse(tokenKey, null)) match {
        case Some(tokenId) =>
          for {
            _ <- inviteIfLoggedIn(request, tokenId)
            dashboardId = getDashboardId(request)
            isPermitted <- dashboardPermissionService.isPermitted(
              tokenId,
              request.currentOrganizationId.get,
              dashboardId,
              action
            )
          } yield {
            isPermitted match {
              case true  => Permitted()
              case false => UnPermitted("Token no permission to view this dashboard.")
            }
          }
        case None => Future.value(UnPermitted("Token is required to view this dashboard."))
      }
    }
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::ViewDashboardRightFilter] isUserPermitted") {
      if (request.isAuthenticated) {
        val dashboardId: DashboardId = getDashboardId(request)
        dashboardPermissionService
          .isPermitted(
            request.currentOrganizationId.get,
            request.currentUser.username,
            dashboardId,
            action
          )
          .map {
            case true  => Permitted()
            case false => UnPermitted("No permission to view this dashboard.")
          }
      } else {
        Future.value(UnPermitted("Login is required to view this dashboard"))
      }
    }
  }
}
