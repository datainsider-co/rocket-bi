package co.datainsider.bi.controller.http.filter.directory

import co.datainsider.bi.controller.http.filter.directory.DirectoryFilter.{getDirectoryId, isDirectoryOwner}
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.service.DirectoryService
import datainsider.profiler.Profiler
import co.datainsider.share.service.DirectoryPermissionService
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.filters.DirectoryAccessFilters
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

import javax.inject.{Inject, Named}
import scala.concurrent.ExecutionContext.Implicits.global

case class DeleteDirectoryRightFilter @Inject() (
    directoryService: DirectoryService,
    directoryPermissionService: DirectoryPermissionService,
    @Named("token_header_key") tokenKey: String
) extends DirectoryAccessFilters.DeleteAccessFilter {

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isUserPermitted, isTokenPermitted)
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::DeleteDirectoryRightFilter] isUserPermitted") {
      if (request.isAuthenticated) {
        val directoryId: DirectoryId = getDirectoryId(request)
        directoryPermissionService
          .isPermitted(
            request.currentOrganizationId.get,
            request.currentUsername,
            directoryId,
            "delete"
          )
          .map {
            case true  => Permitted()
            case false => UnPermitted("No permission to delete this directory.")
          }
      } else {
        Future.value(UnPermitted("Login is required for delete this directory"))
      }
    }
  }

  private def isTokenPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::DeleteDirectoryRightFilter] isTokenPermitted") {
      if (request.isAuthenticated) {
        Option(request.headerMap.getOrElse(tokenKey, null)) match {
          case Some(tokenId) =>
            val directoryId: DirectoryId = getDirectoryId(request)
            directoryPermissionService
              .isPermitted(
                tokenId,
                request.currentOrganizationId.get,
                directoryId,
                "delete"
              )
              .map {
                case true  => Permitted()
                case false => UnPermitted("Token no permission to delete this directory.")
              }
          case None => Future.value(UnPermitted("Token is required for delete this directory"))
        }
      } else {
        Future.value(UnPermitted("Login is required for delete this directory by token."))
      }
    }
  }

}
