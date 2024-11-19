package co.datainsider.caas.user_profile.controller.http

import co.datainsider.bi.controller.http.filter.AccessTokenFilter
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.controller.http.request._
import co.datainsider.caas.user_profile.service.OrganizationService
import co.datainsider.license.domain.LicensePermission
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging

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

  post(s"/organizations/send-verify-email") { request: SendVerifyEmailRequest =>
    Profiler(s"/organizations/send-verify-email POST") {
      organizationService.sendVerifyCode(request.email)
    }
  }

  get("/organizations/my-domain") { request: Request =>
    Profiler(s"/organizations/my-domain GET") {
      val orgDomain: String = request.getRequestDomain()
      organizationService.getByDomain(orgDomain)
    }
  }

  filter[AccessTokenFilter]
    .get("/organizations") { request: Request =>
      Profiler(s"/organizations GET") {
        val licenseKey: String = request.getParam("license_key")
        organizationService.getByLicenseKey(licenseKey)
      }
    }
}
