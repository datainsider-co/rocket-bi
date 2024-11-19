package co.datainsider.caas.admin.controller.http

import co.datainsider.bi.util.profiler.Profiler
import com.twitter.finatra.http.Controller
import co.datainsider.caas.admin.controller.http.request.{DeleteOAuthRequest, MultiUpdateOAuthRequest}
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.license.domain.LicensePermission
import co.datainsider.caas.login_provider.service.OrgOAuthorizationProvider

import javax.inject.{Inject, Named}

case class SettingController @Inject() (
    orgOAuthProvider: OrgOAuthorizationProvider,
    permissionFilter: PermissionFilter
) extends Controller {
  filter(permissionFilter.requireAll("login_method:manage", LicensePermission.EditData))
    .put("/admin/setting/login_methods") { request: MultiUpdateOAuthRequest =>
      Profiler(s"/admin/setting/login_methods PUT") {
        orgOAuthProvider.multiUpdateOauthConfig(request.oauthConfigAsMap).map(_ => request.oauthConfigAsMap)
      }
    }

  filter(permissionFilter.requireAll("login_method:manage", LicensePermission.EditData))
    .delete("/admin/setting/login_methods/:id") { request: DeleteOAuthRequest =>
      Profiler(s"/admin/setting/login_methods DELETE") {
        orgOAuthProvider.deleteOauthConfig(request.getOrganizationId(), request.id)
      }
    }
}
