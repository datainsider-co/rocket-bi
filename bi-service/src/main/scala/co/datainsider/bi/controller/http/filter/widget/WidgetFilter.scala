package co.datainsider.bi.controller.http.filter.widget

import co.datainsider.bi.controller.http.filter.dashboard.DashboardFilter.getDashboardId
import co.datainsider.bi.domain.Ids.{DashboardId, WidgetId}
import co.datainsider.bi.service.DashboardService
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.client.domain.permission.{Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

object WidgetFilter {
  def getWidgetId(request: Request): WidgetId = {
    request.getLongParam("widget_id")
  }

  def isWidgetOwner(dashboardService: DashboardService): AccessValidator = { request: Request =>
    {
      if (request.isAuthenticated) {
        val dashboardId: DashboardId = getDashboardId(request)
        val widgetId: WidgetId = getWidgetId(request)
        val username: String = request.currentUser.username
        val orgId: Long = request.currentOrganizationId.get

        dashboardService
          .getWidget(orgId, dashboardId, widgetId)
          .map(widget => widget.ownerId.equals(username))
          .map {
            case true  => Permitted()
            case false => UnPermitted("You are not the owner of this widget")
          }
      } else {
        Future.value(UnPermitted("Login is required for check owner widget"))
      }
    }
  }
}
