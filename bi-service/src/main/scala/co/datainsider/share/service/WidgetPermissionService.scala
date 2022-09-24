package co.datainsider.share.service

import co.datainsider.bi.domain.Ids.{DashboardId, WidgetId}
import co.datainsider.bi.domain.DirectoryType
import com.google.inject.Inject
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.service.OrgAuthorizationClientService

/**
  * @author tvc12 - Thien Vi
  * @created 03/22/2021 - 6:48 PM
  */
trait WidgetPermissionService {
  def isPermitted(
      orgId: Long,
      username: String,
      dashboardId: DashboardId,
      widgetId: WidgetId,
      action: String
  ): Future[Boolean]

  def isPermitted(
      tokenId: String,
      orgId: Long,
      dashboardId: DashboardId,
      widgetId: WidgetId,
      action: String
  ): Future[Boolean]

}

case class WidgetPermissionServiceImpl @Inject() (
    authorizationService: OrgAuthorizationClientService,
    dashboardPermissionService: DashboardPermissionService,
    tokenService: PermissionTokenService
) extends WidgetPermissionService {
  override def isPermitted(
      orgId: DashboardId,
      username: String,
      dashboardId: DashboardId,
      widgetId: WidgetId,
      action: String
  ): Future[Boolean] = {
    dashboardPermissionService.isPermitted(orgId, username, dashboardId, action)
  }

  def isTokenPermittedDashboard(
      orgId: Long,
      tokenId: String,
      dashboardId: DashboardId,
      widgetId: WidgetId,
      action: String
  ): Future[Boolean] = {
    dashboardPermissionService.isPermitted(tokenId, orgId, dashboardId, action)
  }

  def isTokenPermittedWidget(
      orgId: Long,
      tokenId: String,
      dashboardId: DashboardId,
      widgetId: WidgetId,
      action: String
  ): Future[Boolean] = {
    val permission: String = PermissionProviders.permissionBuilder.perm(orgId, "widget", action, dashboardId.toString)
    tokenService.isPermitted(tokenId, permission)
  }

  override def isPermitted(
      tokenId: String,
      orgId: DashboardId,
      dashboardId: DashboardId,
      widgetId: WidgetId,
      action: String
  ): Future[Boolean] = {
    Seq[(Long, String, DashboardId, WidgetId, String) => Future[Boolean]](
      isTokenPermittedWidget,
      isTokenPermittedDashboard
    )
      .foldLeft(Future.False)((r, fn) => {
        r.flatMap {
          case true => r
          case _    => fn(orgId, tokenId, dashboardId, widgetId, action)
        }
      })
  }
}
