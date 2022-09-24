package co.datainsider.bi.controller.http.filter.dashboard

import co.datainsider.bi.domain.Directory.{MyData, Shared}
import co.datainsider.bi.domain.request.CreateDashboardRequest
import co.datainsider.bi.service.DirectoryService
import co.datainsider.bi.util.Serializer
import datainsider.profiler.Profiler
import co.datainsider.share.service.DirectoryPermissionService
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.authorization.filters.DashboardAccessFilters
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

import javax.inject.{Inject, Named}
import scala.concurrent.ExecutionContext.Implicits.global

case class CreateDashboardRightFilter @Inject() (
    directoryPermissionService: DirectoryPermissionService,
    directoryService: DirectoryService,
    @Named("token_header_key") tokenKey: String
) extends DashboardAccessFilters.CreateAccessFilter {
  val action = "create"

  override protected def getValidatorChain(): Seq[AccessValidator] = {
    Seq(isDirectoryRoot, isDirectoryOwner, isUserPermitted, isTokenPermitted)
  }

  private def isDirectoryRoot(request: Request): Future[PermissionResult] = {
    if (request.isAuthenticated) {
      getCreateDashboardRequest(request).parentDirectoryId match {
        case Shared => Future.value(UnPermitted("No permission create this dashboard."))
        case MyData => Future.value(Permitted())
        case _      => Future.value(UnPermitted("Parent directory id is not a root directory"))
      }
    } else {
      Future.value(UnPermitted("Login is required for create this dashboard"))
    }
  }

  private def getCreateDashboardRequest(request: Request): CreateDashboardRequest = {
    Serializer.fromJson[CreateDashboardRequest](request.contentString)
  }

  private def isDirectoryOwner(request: Request): Future[PermissionResult] =
    Profiler("[Filter::CreateDashboardRightFilter] isDirectoryOwner") {
      if (request.isAuthenticated) {
        val createDashboardRequest: CreateDashboardRequest = getCreateDashboardRequest(request)
        val orgId: Long = request.currentOrganizationId.get
        val permissionResult: Future[PermissionResult] = directoryService
          .isOwner(orgId, createDashboardRequest.parentDirectoryId, request.currentUsername)
          .map {
            case true  => Permitted()
            case false => UnPermitted("You are not the owner of this directory.")
          }
        permissionResult
      } else {
        Future.value(UnPermitted("Login is required to check directory owner"))
      }
    }

  private def isTokenPermitted(request: Request): Future[PermissionResult] = {
    Profiler("[Filter::CreateDashboardRightFilter] isTokenPermitted") {
      if (request.isAuthenticated) {
        Option(request.headerMap.getOrElse(tokenKey, null)) match {
          case Some(tokenId) =>
            val createDashboardRequest: CreateDashboardRequest = getCreateDashboardRequest(request)
            val permissionResult = directoryPermissionService
              .isPermitted(
                tokenId,
                request.currentOrganizationId.get,
                createDashboardRequest.parentDirectoryId,
                action
              )
              .map {
                case true  => Permitted()
                case false => UnPermitted("Token no permission to create this dashboard.")
              }
            permissionResult
          case None => Future.value(UnPermitted("Token is required to create this dashboard."))
        }
      } else {
        Future.value(UnPermitted("Login is required to create this dashboard."))
      }
    }
  }

  private def isUserPermitted(request: Request): Future[PermissionResult] =
    Profiler("[Filter::CreateDashboardRightFilter] isUserPermitted") {
      if (request.isAuthenticated) {
        val createDashboardRequest: CreateDashboardRequest = getCreateDashboardRequest(request)
        val permissionResult: Future[PermissionResult] = directoryPermissionService
          .isPermitted(
            request.currentOrganizationId.get,
            request.currentUsername,
            createDashboardRequest.parentDirectoryId,
            action
          )
          .map {
            case true  => Permitted()
            case false => UnPermitted("No permission to create this dashboard.")
          }
        permissionResult
      } else {
        Future.value(UnPermitted("Login is required to create this dashboard."))
      }
    }
}
