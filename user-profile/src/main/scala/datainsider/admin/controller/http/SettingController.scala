package datainsider.admin.controller.http

import com.twitter.finatra.http.Controller
import datainsider.admin.controller.http.request.MultiUpdateOAuthRequest
import datainsider.authorization.filters.SettingAccessFilters
import datainsider.client.filter.PermissionFilter
import datainsider.login_provider.service.OrgOAuthorizationProvider

import javax.inject.{Inject, Named}

case class SettingController @Inject() (
    orgOAuthProvider: OrgOAuthorizationProvider,
    permissionFilter: PermissionFilter
) extends Controller {
  filter(permissionFilter.require("login_method:manage"))
    .put("/admin/setting/login_methods") { request: MultiUpdateOAuthRequest =>
      {
        orgOAuthProvider.multiUpdateOauthConfig(request.oauthConfigAsMap).map(_ => request.oauthConfigAsMap)
      }
    }
}
