package co.datainsider.caas.admin.filters.users

import com.twitter.finagle.http.Request
import datainsider.authorization.domain.PermissionProviders
import datainsider.authorization.filters.UserAccessFilters
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_caas.service.CaasService

import javax.inject.Inject

@deprecated("Use PermissionFilter instead", since = "2022-07-15")
class CreateAccessFilterImpl @Inject() (
    caasService: CaasService
) extends UserAccessFilters.CreateAccessFilter {

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
        PermissionProviders.user.withOrganizationId(organizationId).create()
      )
      .map(PermissionResult(_, "No permission to create users."))
  }

}
