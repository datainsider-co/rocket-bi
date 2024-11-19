package co.datainsider.caas.apikey.controller.http

import co.datainsider.bi.util.profiler.Profiler
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import co.datainsider.caas.apikey.domain.request._
import co.datainsider.caas.apikey.service.ApiKeyService
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.license.domain.LicensePermission

import javax.inject.Inject

class ApiKeyController @Inject() (apiKeyService: ApiKeyService, permissionFilter: PermissionFilter)
    extends Controller
    with Logging {

  filter(permissionFilter.requireAll("apikey:view:[api_key]", LicensePermission.ViewData))
    .get(s"/apikey/:api_key") { request: GetApiKeyRequest =>
      Profiler(s"/apikey/:api_key GET") {
        apiKeyService.getApiKey(request)
      }
    }

  filter(permissionFilter.requireAll("apikey:create:*", LicensePermission.EditData))
    .post(s"/apikey") { request: CreateApiKeyRequest =>
      Profiler(s"/apikey POST") {
        apiKeyService.create(request)
      }
    }

  filter(permissionFilter.requireAll("apikey:view:*", LicensePermission.ViewData))
    .post(s"/apikey/list") { request: ListApiKeyRequest =>
      Profiler(s"/apikey/list") {
        apiKeyService.listApiKeys(request)
      }
    }

  filter(permissionFilter.requireAll("apikey:edit:[api_key]", LicensePermission.EditData))
    .put(s"/apikey/:api_key") { request: UpdateApiKeyRequest =>
      Profiler(s"/apikey/:api_key PUT") {
        apiKeyService.updateApiKey(request).map(result => Map("success" -> result))
      }
    }

  filter(permissionFilter.requireAll("apikey:delete:[api_key]", LicensePermission.EditData))
    .delete(s"/apikey/:api_key") { request: DeleteApiKeyRequest =>
      Profiler(s"/apikey/:api_key DELETE") {
        apiKeyService
          .deleteApiKey(request.currentOrganizationId.get, request.apiKey)
          .map(result => Map("success" -> result))
      }
    }
}
