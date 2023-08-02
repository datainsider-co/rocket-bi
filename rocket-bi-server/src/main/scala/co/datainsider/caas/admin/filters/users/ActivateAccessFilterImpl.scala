package co.datainsider.caas.admin.filters.users

import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import datainsider.authorization.filters.UserAccessFilters
import datainsider.client.domain.permission.PermissionResult
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_caas.service.CaasService

import javax.inject.Inject

@deprecated("Use PermissionFilter instead", since = "2022-07-15")
class ActivateAccessFilterImpl @Inject() (
    caasService: CaasService
) extends UserAccessFilters.ActivateAccessFilter {

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isPermissionPermitted)
  }

  private def isPermissionPermitted(request: Request): Future[PermissionResult] = {
    val organizationId = request.currentOrganizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }
    caasService
      .orgAuthorization()
      .isPermitted(
        organizationId,
        request.currentUser.username,
        PermissionProviders.permissionBuilder.perm(organizationId, "user", "activate", "*")
      )
      .map(PermissionResult(_, "No permission to activate users."))
  }
}

class DeactivateAccessFilterImpl @Inject() (
    caasService: CaasService
) extends UserAccessFilters.DeactivateAccessFilter {

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isPermissionPermitted)
  }

  private def isPermissionPermitted(request: Request): Future[PermissionResult] = {
    val organizationId = request.currentOrganizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }
    caasService
      .orgAuthorization()
      .isPermitted(
        organizationId,
        request.currentUser.username,
        PermissionProviders.permissionBuilder.perm(organizationId, "user", "deactivate", "*")
      )
      .map(PermissionResult(_, "No permission to deactivate users."))
  }
}
