package co.datainsider.bi.controller.http.filter.directory

import co.datainsider.bi.domain.Ids.DirectoryId
import co.datainsider.bi.service.DirectoryService
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

object DirectoryFilter {
  def getDirectoryId(request: Request): DirectoryId = {
    Profiler("[Filter::BaseDirectoryFilter] getDirectoryId") {
      request.getLongParam("id", -1L) match {
        case id: Long => id
        case _        => request.getLongParam("directory_id")
      }
    }
  }

  def isDirectoryOwner(directoryService: DirectoryService): Request => Future[PermissionResult] = { request =>
    Profiler("[Filter::DirectoryFilter] isDirectoryOwner") {
      if (request.isAuthenticated) {
        val username: String = request.currentUser.username
        val orgId: Long = request.currentOrganizationId.get
        val permissionResult: Future[PermissionResult] = directoryService
          .isOwner(orgId, getDirectoryId(request), username)
          .map {
            case true  => Permitted()
            case false => UnPermitted("You are not the owner of this directory")
          }
        permissionResult
      } else {
        Future.value(UnPermitted("Login is required for check owner of this directory"))
      }
    }
  }
}
