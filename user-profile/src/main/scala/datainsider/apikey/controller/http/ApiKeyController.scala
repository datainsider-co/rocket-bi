package datainsider.apikey.controller.http

import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import datainsider.apikey.domain.request._
import datainsider.apikey.service.ApiKeyService
import datainsider.client.filter.PermissionFilter

import javax.inject.Inject

class ApiKeyController @Inject() (apiKeyService: ApiKeyService, permissionFilter: PermissionFilter) extends Controller with Logging {

  filter(permissionFilter.require("apikey:view:[api_key]"))
    .get(s"/apikey/:api_key") { request: GetApiKeyRequest =>
      apiKeyService.getApiKey(request)
    }

  filter(permissionFilter.require("apikey:create:*"))
    .post(s"/apikey") { request: CreateApiKeyRequest =>
      apiKeyService.create(request)
    }

  filter(permissionFilter.require("apikey:view:*"))
    .post(s"/apikey/list") { request: ListApiKeyRequest =>
      apiKeyService.listApiKeys(request)
    }

  filter(permissionFilter.require("apikey:edit:[api_key]"))
    .put(s"/apikey/:api_key") { request: UpdateApiKeyRequest =>
      apiKeyService.updateApiKey(request).map(result => Map("success" -> result))
    }

  filter(permissionFilter.require("apikey:delete:[api_key]"))
    .delete(s"/apikey/:api_key") { request: DeleteApiKeyRequest =>
      apiKeyService
        .deleteApiKey(request.currentOrganizationId.get, request.apiKey)
        .map(result => Map("success" -> result))
    }
}
