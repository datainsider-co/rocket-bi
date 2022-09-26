package datainsider.user_profile.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import datainsider.client.exception.OrganizationNotFoundError
import datainsider.client.filter.{MustLoggedInFilter, PermissionFilter}
import datainsider.client.filter.UserContext.UserContextSyntax
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

  get(s"/organizations") { request: GetAllOrganizationsRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::GetAllOrganizationsRequest") {
      organizationService.getAllOrganizations(request.from.getOrElse(0), request.size.getOrElse(20))
    }
  }

  filter[MustLoggedInFilter]
    .get(s"/organizations/joined") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/organizations/joined") {
        organizationService.getJoinedOrganizations(request.currentUser.username)
      }
    }

  post(s"/organizations") { request: RegisterOrgRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::RegisterOrgRequest") {
      organizationService.register(request)
    }
  }

  get(s"/organizations/domain/check") { request: Request =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::/organizations/domain/check") {
      val subDomain = request.getParam("sub_domain")
      organizationService.isSubDomainExisted(subDomain).map(isExisted => Map("existed" -> isExisted))
    }
  }

  filter[MustLoggedInFilter]
    .filter[CanGetOrganizationFilter]
    .get(s"/organizations/:organization_id") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/organizations/:organization_id") {
        val organizationId = request.getLongParam("organization_id")
        organizationService.getOrganization(organizationId).map {
          case Some(organization) => organization
          case _                  => throw OrganizationNotFoundError(s"this organization is not found: $organizationId")
        }
      }
    }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.require("organization:delete:[organization_id]"))
    .delete(s"/organizations/:organization_id") { request: Request =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::/organizations/:organization_id") {
        val organizationId = request.getLongParam("organization_id")
        organizationService.deleteOrganization(organizationId)

      }
    }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.require("organization:edit:[organization_id]"))
    .put(s"/organizations/:organization_id/domain") { request: UpdateDomainRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::UpdateDomainRequest") {
        organizationService
          .updateDomain(request.organizationId, request.newSubDomain)
          .map(success => Map("success" -> success))
      }
    }

  filter[MustLoggedInFilter]
    .filter[CanAddOrgMemberFilter]
    .post(s"/organizations/:organization_id/members") { request: AddOrgMemberRequest =>
      Profiler(s"[Http] ${this.getClass.getSimpleName}::AddOrgMemberRequest") {
        organizationService.addMember(
          request.organizationId,
          request.username,
          request.currentUser.username
        )
      }
    }

}
