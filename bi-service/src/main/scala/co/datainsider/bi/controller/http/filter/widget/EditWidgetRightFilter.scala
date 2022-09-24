package co.datainsider.bi.controller.http.filter.widget

import co.datainsider.bi.controller.http.filter.dashboard.DashboardFilter.getDashboardId
import co.datainsider.bi.controller.http.filter.widget.WidgetFilter.{getWidgetId, isWidgetOwner}
import co.datainsider.bi.domain.Ids.{DashboardId, WidgetId}
import co.datainsider.bi.service.DashboardService
import co.datainsider.share.service.WidgetPermissionService
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.filters.WidgetAccessFilters
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

import javax.inject.{Inject, Named}

@deprecated("Use PermissionFilter instead", since = "2022-07-15")
case class EditWidgetRightFilter @Inject() (
    dashboardService: DashboardService,
    widgetPermissionService: WidgetPermissionService,
    @Named("token_header_key") tokenKey: String
) extends WidgetAccessFilters.EditAccessFilter {
  val action = "edit"
  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isWidgetOwner(dashboardService), isTokenPermitted, isUserPermitted)
  }

  private def isTokenPermitted(request: Request): Future[PermissionResult] = {
    Option(request.headerMap.getOrElse(tokenKey, null)) match {
      case Some(tokenId) =>
        val widgetId: WidgetId = getWidgetId(request)
        val dashboardId: DashboardId = getDashboardId(request)
        widgetPermissionService
          .isPermitted(
            tokenId,
            request.currentOrganizationId.get,
            dashboardId,
            widgetId,
            action
          )
          .map {
            case true  => Permitted()
            case false => UnPermitted("Token no permission to edit this widget.")
          }
      case None => Future.value(UnPermitted("Token is required to edit this widget."))
    }
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    if (request.isAuthenticated) {
      val widgetId = getWidgetId(request)
      val dashboardId = getDashboardId(request)
      widgetPermissionService
        .isPermitted(
          request.currentOrganizationId.get,
          request.currentUser.username,
          dashboardId,
          widgetId,
          action
        )
        .map {
          case true  => Permitted()
          case false => UnPermitted("No permission to edit this widget.")
        }
    } else {
      Future.value(UnPermitted("Login is required to edit this widget."))
    }
  }
}
