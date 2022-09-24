package co.datainsider.bi.controller.http.filter.directory

import co.datainsider.bi.controller.http.filter.directory.DirectoryFilter.{getDirectoryId, isDirectoryOwner}
import co.datainsider.bi.domain.Directory.{MyData, Shared}
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

case class CopyDirectoryRightFilter @Inject() (
    directoryService: DirectoryService,
    directoryPermissionService: DirectoryPermissionService,
    @Named("token_header_key") tokenKey: String
) extends DirectoryAccessFilters.CopyAccessFilter {

  val action = "copy"

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isUserPermitted)
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::CopyDirectoryRightFilter] isUserPermitted") {
      if (request.isAuthenticated) {
        val directoryId: DirectoryId = getDirectoryId(request)
        val permissionResult: Future[PermissionResult] = directoryPermissionService
          .isPermitted(
            request.currentOrganizationId.get,
            request.currentUsername,
            directoryId,
            action
          )
          .map {
            case true  => Permitted()
            case false => UnPermitted("No permission to copy/duplicate this directory.")
          }
        permissionResult
      } else {
        Future.value(UnPermitted("Login is required to copy directory"))
      }
    }
  }
}
