package datainsider.data_cook.controller.http.filter.etl.SchemaFilter

import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.BaseAccessFilter
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.service.OrgAuthorizationClientService
import datainsider.ingestion.controller.http.requests.PermResourceType

import javax.inject.Inject

@deprecated("Use PermissionFilter instead", since = "2022-07-15")
case class EditEtlAccessFilter @Inject() (
    authorizationService: OrgAuthorizationClientService
) extends BaseAccessFilter {

  val action: String = "edit"

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isUserPermitted)
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    val organizationId = request.currentOrganizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }
    if (request.isAuthenticated) {
      val resourceId: String = request.getParam("id")
      authorizationService
        .isPermitted(
          organizationId,
          request.currentUsername,
          PermissionProviders.permissionBuilder.perm(organizationId, PermResourceType.ETL.toString, action, resourceId)
        )
        .map {
          case true  => Permitted()
          case false => UnPermitted("No permission to edit this job.")
        }
    } else {
      Future.value(UnPermitted("Login is required to edit this job."))
    }
  }
}
