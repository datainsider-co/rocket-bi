package co.datainsider.caas.admin.filters.settings

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import co.datainsider.caas.admin.filters.users.PermissionResult
import datainsider.authorization.domain.PermissionProviders
import datainsider.authorization.filters.SettingAccessFilters
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_caas.service.CaasService

@deprecated("Use PermissionFilter instead", since = "2022-07-15")
class EditAccessFilterImpl @Inject() (caasService: CaasService) extends SettingAccessFilters.EditAccessFilter {
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
        PermissionProviders.setting.withOrganizationId(organizationId).edit()
      )
      .map(PermissionResult(_, "No permission to edit setting."))
  }
}
