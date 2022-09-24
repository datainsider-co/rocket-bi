package co.datainsider.bi.controller.http.filter.directory

import co.datainsider.bi.controller.http.filter.AnonymousLoginResponse.anonymousUserProfile
import co.datainsider.bi.controller.http.filter.directory.DirectoryFilter.{getDirectoryId, isDirectoryOwner}
import co.datainsider.bi.domain.Directory.{MyData, Shared}
import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.domain.{Dashboard, DirectoryType}
import co.datainsider.bi.service.DirectoryService
import co.datainsider.bi.util.ZConfig
import datainsider.profiler.Profiler
import co.datainsider.share.service.{DirectoryPermissionService, ShareService}
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.filters.DirectoryAccessFilters
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

import javax.inject.{Inject, Named}
import scala.concurrent.ExecutionContext.Implicits.global

case class ViewDirectoryRightFilter @Inject() (
    directoryService: DirectoryService,
    shareService: ShareService,
    directoryPermissionService: DirectoryPermissionService,
    @Named("token_header_key") tokenKey: String
) extends DirectoryAccessFilters.ViewAccessFilter {
  val action = "view"

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isViewDirectoryRoot, isTokenPermitted, isUserPermitted)
  }

  private def isViewDirectoryRoot(request: Request): Future[PermissionResult] =
    Profiler("[Filter::ViewDirectoryRightFilter] isViewDirectoryRoot") {
      if (request.isAuthenticated) {
        getDirectoryId(request) match {
          case MyData | Shared => Future.value(Permitted())
          case _               => Future.value(UnPermitted("Directory id is not a root directory"))
        }
      } else {
        Future.value(UnPermitted("Login is required to view root directory"))
      }
    }

  private def isUserPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::ViewDirectoryRightFilter] isUserPermitted") {
      if (request.isAuthenticated) {
        val directoryId: DirectoryId = getDirectoryId(request)
        directoryPermissionService
          .isPermitted(
            request.currentOrganizationId.get,
            request.currentUsername,
            directoryId,
            action
          )
          .map {
            case true  => Permitted()
            case false => UnPermitted("No permission to view this directory.")
          }
      } else {
        Future.value(UnPermitted("Login is required to view this directory."))
      }
    }
  }

  def inviteIfLoggedIn(request: Request, tokenId: String): Future[Unit] = {
    Profiler("[Filter::ViewDirectoryRightFilter] inviteIfLoggedIn") {
      if (isRealUser(request)) {
        shareService
          .invite(
            request.currentOrganizationId.get,
            DirectoryType.Directory.toString,
            getDirectoryId(request).toString,
            Seq(request.currentUsername),
            tokenId
          )
          .unit
      } else {
        Future.Unit
      }
    }
  }

  def isRealUser(request: Request): Boolean = {
    request.isAuthenticated && (request.currentUsername != anonymousUserProfile.username)
  }

  private def isTokenPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::ViewDirectoryRightFilter] isTokenPermitted") {
      Option(request.headerMap.getOrElse(tokenKey, null)) match {
        case Some(tokenId) =>
          for {
            _ <- inviteIfLoggedIn(request, tokenId)
            directoryId: DirectoryId = getDirectoryId(request)
            isPermitted <- directoryPermissionService.isPermitted(
              tokenId,
              request.currentOrganizationId.get,
              directoryId,
              action
            )
          } yield {
            isPermitted match {
              case true  => Permitted()
              case false => UnPermitted("Token no permission to view this directory.")
            }
          }
        case _ => Future.value(UnPermitted("Token is required by to view this directory."))
      }
    }
  }
}
