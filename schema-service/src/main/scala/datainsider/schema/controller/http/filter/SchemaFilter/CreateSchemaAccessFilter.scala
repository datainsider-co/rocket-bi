package datainsider.schema.controller.http.filter.SchemaFilter

import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.BaseAccessFilter
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.service.OrgAuthorizationClientService

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 05/06/2021 - 11:41 PM
  *
  */

@deprecated("unused from 2022-07-15, remove in next version", since = "2022-07-15")
case class CreateSchemaAccessFilter @Inject() (authorizationService: OrgAuthorizationClientService)
    extends BaseAccessFilter {
  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isUserPermitted)
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    val organizationId = request.currentOrganizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }
    if (request.isAuthenticated) {
      authorizationService
        .isPermitted(
          organizationId,
          request.currentUsername,
          PermissionProviders.database.withOrganizationId(organizationId).create()
        )
        .map {
          case true  => Permitted()
          case false => UnPermitted("No permission to create this schema.")
        }
    } else {
      Future.value(UnPermitted("Login is required to create this schema."))
    }
  }
}
