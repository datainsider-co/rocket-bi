package datainsider.admin.filters.perms

import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.admin.filters.users.PermissionResult
import datainsider.authorization.domain.PermissionProviders
import datainsider.authorization.filters.PermissionAccessFilters
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.user_caas.service.CaasService

import javax.inject.Inject

@deprecated("Use PermissionFilter instead", since = "2022-07-15")
class EditAccessFilterImpl @Inject()(
    caasService: CaasService
) extends PermissionAccessFilters.EditAccessFilter {

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
        PermissionProviders.perm.withOrganizationId(organizationId).edit()
      ).map(PermissionResult(_, "No permission to edit permissions."))
  }

}
