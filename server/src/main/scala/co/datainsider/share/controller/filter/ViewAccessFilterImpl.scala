package co.datainsider.share.controller.filter

import co.datainsider.bi.service.{DashboardService, DirectoryService}
import co.datainsider.share.controller.filter.BaseShareFilter.{getResourceId, getResourceType, isResourceOwner}
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import co.datainsider.common.authorization.domain.PermissionProviders
import co.datainsider.common.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import co.datainsider.common.client.filter.BaseAccessFilter.AccessValidator
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.client.OrgAuthorizationClientService

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 03/11/2021 - 3:34 PM
  */
case class ViewAccessFilterImpl @Inject() (
    directoryService: DirectoryService,
    dashboardService: DashboardService,
    authorizationService: OrgAuthorizationClientService
) extends ShareAccessFilters.ViewAccessFilter {
  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isResourceOwner(directoryService, dashboardService), isPermissionPermitted)
  }

  private def isPermissionPermitted(request: Request): Future[PermissionResult] = {
    val resourceId: String = getResourceId(request)
    val resourceType: String = getResourceType(request)
    val permissionResult: Future[PermissionResult] = authorizationService
      .isPermitted(
        request.currentOrganization.map(_.organizationId).get,
        request.currentUser.username,
        PermissionProviders.permissionBuilder.perm(request.currentOrganizationId.get, resourceType, "view", resourceId)
      )
      .map {
        case true  => Permitted()
        case false => UnPermitted("No permission to view this resource.")
      }
    permissionResult
  }
}

case class MockViewAccessFilter() extends ShareAccessFilters.ViewAccessFilter {
  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq((_) => Future.value(Permitted()))
  }
}
