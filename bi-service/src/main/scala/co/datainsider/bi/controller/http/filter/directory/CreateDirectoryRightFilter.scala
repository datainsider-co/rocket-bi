package co.datainsider.bi.controller.http.filter.directory

import co.datainsider.bi.controller.http.filter.directory.DirectoryFilter.getDirectoryId
import co.datainsider.bi.domain.Directory
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain.request.CreateDirectoryRequest
import co.datainsider.bi.service.DirectoryService
import datainsider.profiler.Profiler
import co.datainsider.share.service.DirectoryPermissionService
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.filters.DirectoryAccessFilters
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.util.JsonParser

import javax.inject.{Inject, Named}
import scala.concurrent.ExecutionContext.Implicits.global

case class CreateDirectoryRightFilter @Inject() (
    directoryService: DirectoryService,
    directoryPermissionService: DirectoryPermissionService,
    @Named("token_header_key") tokenKey: String
) extends DirectoryAccessFilters.CreateAccessFilter {
  val action = "create"

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isDirectoryRoot, isParentDirectoryOwner, isUserPermitted, isTokenPermitted)
  }

  private def isDirectoryRoot(request: Request): Future[PermissionResult] =
    Profiler("[Filter::CreateDirectoryRightFilter] isDirectoryRoot") {
      if (request.isAuthenticated) {
        getDirectoryId(request) match {
          case Directory.Shared => Future.value(UnPermitted("No permission to create directory at share"))
          case Directory.MyData => Future.value(Permitted())
          case _                => Future.value(UnPermitted("Parent id is not a root directory"))
        }
      } else {
        Future.value(UnPermitted("Login is required to create directory at root"))
      }
    }

  private def getParentDirectoryId(request: Request): DirectoryId = {
    val parentId: DirectoryId = JsonParser.fromJson[CreateDirectoryRequest](request.contentString).parentId
    parentId
  }

  private def isParentDirectoryOwner(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::CreateDirectoryRightFilter] isParentDirectoryOwner") {
      if (request.isAuthenticated) {
        val parentDirectoryId: DirectoryId = getParentDirectoryId(request)
        val currentUsername: String = request.currentUsername
        val orgId: Long = request.currentOrganizationId.get

        directoryService
          .get(orgId, parentDirectoryId)
          .map(directory => directory.ownerId.equals(currentUsername))
          .map {
            case true  => Permitted()
            case false => UnPermitted("You are not the owner of this directory.")
          }
      } else {
        Future.value(UnPermitted("Login is required for check owner of this directory"))
      }
    }
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::CreateDirectoryRightFilter] isUserPermitted") {
      if (request.isAuthenticated) {
        val directoryId: DirectoryId = getParentDirectoryId(request)
        directoryPermissionService
          .isPermitted(
            request.currentOrganizationId.get,
            request.currentUsername,
            directoryId,
            action
          )
          .map {
            case true  => Permitted()
            case false => UnPermitted("No permission to create this directory.")
          }
      } else {
        Future.value(UnPermitted("Login is required to create this directory"))
      }
    }
  }

  private def isTokenPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::CreateDirectoryRightFilter] isTokenPermitted") {
      if (request.isAuthenticated) {
        Option(request.headerMap.getOrElse(tokenKey, null)) match {
          case Some(tokenId) =>
            val directoryId: DirectoryId = getParentDirectoryId(request)
            directoryPermissionService
              .isPermitted(
                tokenId,
                request.currentOrganizationId.get,
                directoryId,
                action
              )
              .map {
                case true  => Permitted()
                case false => UnPermitted("Token no permission to create this directory.")
              }
          case None => Future.value(UnPermitted("Token is required for create this directory"))
        }
      } else {
        Future.value(UnPermitted("Login is required for create this directory by token."))
      }
    }
  }

}
