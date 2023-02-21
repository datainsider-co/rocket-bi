package datainsider.analytics.controller.http

import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import datainsider.analytics.service.tracking.ApiKeyService
import datainsider.ingestion.controller.http.filter.AdminSecretKeyFilter
import datainsider.ingestion.controller.http.requests._

import javax.inject.Named

case class ApiKeyController @Inject() (
    @Named("admin_secret_key") adminSecretKey: String,
    apiKeyService: ApiKeyService
) extends Controller {

  filter[AdminSecretKeyFilter]
    .post("/analytics/api_key") { request: CreateApiKeyRequest =>
      apiKeyService.createApiKey(request)
    }

  filter[AdminSecretKeyFilter]
    .post("/analytics/api_key/add") { request: AddApiKeyRequest =>
      apiKeyService.addApiKey(request.buildApiKeyInfo())
    }

  get("/analytics/api_key/:api_key") { request: GetApiKeyRequest =>
    apiKeyService.getApiKey(request.apiKey)
  }

  filter[AdminSecretKeyFilter]
    .delete("/analytics/api_key/:api_key") { request: DeleteApiKeyRequest =>
      apiKeyService.deleteApiKey(request.apiKey).map(success => Map("success" -> success))

    }
}
