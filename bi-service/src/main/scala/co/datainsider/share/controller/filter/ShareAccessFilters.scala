package co.datainsider.share.controller.filter

import co.datainsider.bi.domain.DirectoryType
import co.datainsider.bi.service.{DashboardService, DirectoryService}
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.exception.{UnAuthorizedError, UnsupportedError}
import datainsider.client.filter.BaseAccessFilter
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

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
    val orgId: Long = request.currentOrganizationId.get

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
      case _                                               => Future.exception(UnsupportedError("Unsupported share this resource"))
    }
  }
}
