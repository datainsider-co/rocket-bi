package co.datainsider.share.controller.filter

import co.datainsider.bi.domain.DirectoryType
import co.datainsider.bi.service.{DashboardService, DirectoryService}
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import co.datainsider.common.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import co.datainsider.common.client.exception.UnAuthorizedError
import co.datainsider.common.client.filter.BaseAccessFilter
import co.datainsider.common.client.filter.BaseAccessFilter.AccessValidator
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax

/**
  * @author tvc12 - Thien Vi
  * @created 03/11/2021 - 3:15 PM
  */
object ShareAccessFilters extends AnyRef {
  trait ViewAccessFilter extends BaseAccessFilter

  trait EditAccessFilter extends BaseAccessFilter

  trait DeleteAccessFilter extends BaseAccessFilter
}

object BaseShareFilter {
  def getResourceId(request: Request): String = request.getParam("resource_id")

  def getResourceType(request: Request): String = request.getParam("resource_type")

  def isDirectoryOwner(directoryService: DirectoryService, request: Request): Future[PermissionResult] = {
    val resourceId: String = getResourceId(request)
    val username: String = request.currentUser.username
    val orgId: Long = request.getOrganizationId()

    val permissionResult: Future[PermissionResult] = directoryService
      .isOwner(orgId, resourceId.toLong, username)
      .map {
        case true  => Permitted()
        case false => UnPermitted("You are not the owner of this directory")
      }
    permissionResult
  }

  def isDashboardOwner(dashboardService: DashboardService, request: Request): Future[PermissionResult] = {
    val resourceId: String = getResourceId(request)
    val username: String = request.currentUser.username
    val organizationId = request.currentOrganizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }
    val permissionResult: Future[PermissionResult] = dashboardService
      .get(organizationId, resourceId.toLong)
      .map(dashboard => dashboard.ownerId.equals(username))
      .map {
        case true  => Permitted()
        case false => UnPermitted("You are not the owner of this dashboard")
      }
    permissionResult
  }

  def isResourceOwner(
      directoryService: DirectoryService,
      dashboardService: DashboardService
  ): AccessValidator = { request: Request =>
    DirectoryType.withName(getResourceType(request)) match {
      case DirectoryType.Directory                         => isDirectoryOwner(directoryService, request)
      case DirectoryType.Dashboard | DirectoryType.Queries => isDashboardOwner(dashboardService, request)
      case DirectoryType.RetentionAnalysis | DirectoryType.FunnelAnalysis | DirectoryType.EventAnalysis |
          DirectoryType.PathExplorer =>
        isDirectoryOwner(directoryService, request)
    }
  }
}
