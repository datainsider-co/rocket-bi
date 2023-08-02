package co.datainsider.caas.user_profile.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import co.datainsider.caas.user_profile.controller.http.filter.{MustLoggedInFilter, PermissionFilter}
import co.datainsider.license.domain.LicensePermission
import co.datainsider.caas.user_profile.controller.http.request._
import co.datainsider.caas.user_profile.service.OrganizationService
import datainsider.client.exception.OrganizationNotFoundError

import javax.inject.Inject

/**
  * @author anhlt
  */
class OrganizationController @Inject() (organizationService: OrganizationService, permissionFilter: PermissionFilter)
    extends Controller
    with Logging {

  post(s"/organizations") { request: RegisterOrgRequest =>
    Profiler(s"/organizations POST") {
      organizationService.register(request)
    }
  }

  filter(permissionFilter.requireAll("organization:edit:*", LicensePermission.ViewData))
    .put(s"/organizations") { request: UpdateOrganizationRequest =>
      Profiler(s"/organizations PUT") {
        organizationService.update(
          request.getOrganizationId(),
          request.name,
          request.thumbnailUrl,
          request.currentUsername
        )
      }
    }

  get(s"/organizations/domain/check") { request: Request =>
    Profiler(s"/organizations/domain/check") {
      val subDomain = request.getParam("sub_domain")
      organizationService.isDomainValid(subDomain)
    }
  }

  filter[MustLoggedInFilter]
    .filter[CanGetOrganizationFilter]
    .get(s"/organizations/me") { request: Request =>
      Profiler(s"/organizations/me") {
        val organizationId = request.currentOrganizationId.get
        organizationService.getOrganization(organizationId).map {
          case Some(organization) => organization
          case _                  => throw OrganizationNotFoundError(s"this organization is not found: $organizationId")
        }
      }
    }

  get("/organizations/my-domain") { request: Request =>
    Profiler(s"/organizations/my-domain") {
      val orgDomain: String = request.getRequestDomain()
      organizationService.getByDomain(orgDomain)
    }
  }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.requireAll("organization:delete:*", LicensePermission.EditData))
    .delete(s"/organizations/:organization_id") { request: Request =>
      Profiler(s"/organizations/:organization_id DELETE") {
        val organizationId = request.getLongParam("organization_id")
        organizationService.deleteOrganization(organizationId)

      }
    }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.requireAll("organization:delete:*", LicensePermission.EditData))
    .put(s"/organizations/:organization_id/domain") { request: UpdateDomainRequest =>
      Profiler(s"/organizations/:organization_id/domain PUT") {
        organizationService
          .updateDomain(request.organizationId, request.newSubDomain)
          .map(success => Map("success" -> success))
      }
    }

}
