package datainsider.apikey.controller.filter

import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.BaseAccessFilter
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.user_caas.service.OrgAuthorizationService
import datainsider.user_profile.service.OrganizationService

import javax.inject.Inject

class ManageApiKeyFilter @Inject() (organizationService: OrgAuthorizationService) extends BaseAccessFilter {
  override protected def getValidatorChain(): Seq[AccessValidator] = Seq(hasManageApiKeyPermission)

  private def hasManageApiKeyPermission(request: Request): Future[PermissionResult] = {
    val organizationId = request.currentOrganizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }

    if (request.isAuthenticated) {
      organizationService
        .isPermitted(
          organizationId,
          request.currentUsername,
          PermissionProviders.setting.withOrganizationId(organizationId).all()
        )
        .map {
          case true  => Permitted()
          case false => UnPermitted("No permission to manage api key")
        }
    } else {
      Future.value(UnPermitted("Login is required to manage api key"))
    }
  }
}
