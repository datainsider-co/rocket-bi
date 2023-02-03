package datainsider.user_profile.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import datainsider.client.exception.OrganizationNotFoundError
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.filter.{MustLoggedInFilter, PermissionFilter}
import datainsider.profiler.Profiler
import datainsider.user_profile.controller.http.request._
import datainsider.user_profile.service.OrganizationService

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author anhlt
  */
class OrganizationController @Inject() (organizationService: OrganizationService, permissionFilter: PermissionFilter)
    extends Controller
    with Logging {

  post(s"/organizations") { request: RegisterOrgRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::RegisterOrgRequest") {
      organizationService.register(request)
    }
  }

  filter(permissionFilter.require("organization:edit:*"))
    .put(s"/organizations") { request: UpdateOrganizationRequest =>
      {
        Profiler(s"[Http] ${this.getClass.getSimpleName}::UpdateOrganizationRequest") {
          organizationService.update(
            request.getOrganizationId(),
            request.name,
            request.thumbnailUrl,
            request.currentUsername
          )
        }
      }
    }

  get(s"/organizations/domain/check") { request: Request =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::/organizations/domain/check") {
      val subDomain = request.getParam("sub_domain")
      organizationService.isDomainValid(subDomain)
    }
  }

  filter[MustLoggedInFilter]
    .filter[CanGetOrganizationFilter]
    .get(s"/organizations/me") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/organizations/me") {
        val organizationId = request.currentOrganizationId.get
        organizationService.getOrganization(organizationId).map {
          case Some(organization) => organization
          case _                  => throw OrganizationNotFoundError(s"this organization is not found: $organizationId")
        }
      }
    }

  get("/organizations/my-domain") { request: Request =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::/organizations/my-domain") {
      val orgDomain: String = getRequestDomain(request)
      organizationService.getByDomain(orgDomain)
    }
  }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.require("organization:delete:*"))
    .delete(s"/organizations/:organization_id") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/organizations/:organization_id") {
        val organizationId = request.getLongParam("organization_id")
        organizationService.deleteOrganization(organizationId)

      }
    }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.require("organization:delete:*"))
    .put(s"/organizations/:organization_id/domain") { request: UpdateDomainRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::UpdateDomainRequest") {
        organizationService
          .updateDomain(request.organizationId, request.newSubDomain)
          .map(success => Map("success" -> success))
      }
    }

  private def getRequestDomain(request: Request): String = {
    request.headerMap.get("Host") match {
      case Some(host) => host.split('.').head
      case None       => ""
    }
  }

}
