package co.datainsider.caas.admin.filters.perms

import com.twitter.finagle.http.Request
import com.twitter.util.Future
import co.datainsider.caas.admin.filters.users.PermissionResult
import datainsider.authorization.domain.PermissionProviders
import datainsider.authorization.filters.PermissionAccessFilters
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_caas.service.CaasService

import javax.inject.Inject

@deprecated("Use PermissionFilter instead", since = "2022-07-15")
class CreateAccessFilterImpl @Inject() (
    caasService: CaasService
) extends PermissionAccessFilters.CreateAccessFilter {

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isPermissionPermitted)
  }

  private def isPermissionPermitted(request: Request) = {
    val organizationId = request.currentOrganizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }
    caasService
      .orgAuthorization()
      .isPermitted(
        organizationId,
        request.currentUser.username,
        PermissionProviders.perm.withOrganizationId(organizationId).create()
      )
      .map(PermissionResult(_, "No permission to create permissions."))
  }

}
