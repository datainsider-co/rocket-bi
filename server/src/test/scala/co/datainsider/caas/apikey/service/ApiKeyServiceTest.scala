package co.datainsider.caas.apikey.service

import co.datainsider.caas.apikey.domain.request._
import co.datainsider.caas.apikey.domain.response.{ApiKeyResponse, ListApiKeyResponse}
import co.datainsider.caas.user_caas.service.UserService
import co.datainsider.caas.user_caas.services.DataInsiderIntegrationTest
import co.datainsider.bi.util.Implicits.FutureEnhance
import co.datainsider.caas.user_profile.domain.user.LoginResponse
import co.datainsider.caas.user_profile.controller.http.filter.parser.MockUserContext
import co.datainsider.license.domain.LicensePermission

class ApiKeyServiceTest extends DataInsiderIntegrationTest {

  val apiKeyService: ApiKeyService = injector.instance[ApiKeyService]
  val userService: UserService = injector.instance[UserService]
  var apiKey: String = ""
  val baseRequest = MockUserContext.getLoggedInRequest(0, "root")

  test("create api key test") {
    val displayName: String = "test_api_key"
    val request = new CreateApiKeyRequest(
      displayName = displayName,
      expiredTimeMs = Some(100000),
      permissions = Set("directory:*:*", LicensePermission.ViewData, LicensePermission.EditData),
      request = baseRequest
    )
    val apiKeyResponse: ApiKeyResponse = apiKeyService.create(request).syncGet()
    assert(apiKeyResponse.apiKeyInfo.displayName.equals(displayName))
    assert(apiKeyResponse.apiKeyInfo.expiredTimeMs.equals(100000L))
    apiKey = apiKeyResponse.apiKeyInfo.apiKey
  }

  test("get api key test") {
    val request = new GetApiKeyRequest(apiKey = apiKey, request = baseRequest)
    val apiKeyResponse: ApiKeyResponse = apiKeyService.getApiKey(request).syncGet()
    assert(apiKeyResponse.apiKeyInfo.apiKey.equals(apiKey))
  }

  test("list api key test") {
    val request = new ListApiKeyRequest(keyword = Some(""), from = 0, size = 10, sorts = Seq(), request = baseRequest)
    val listApiKeyResponse: ListApiKeyResponse = apiKeyService.listApiKeys(request).syncGet()
    println(listApiKeyResponse)
    assert(listApiKeyResponse.total.equals(1L))
    assert(listApiKeyResponse.data.nonEmpty)
    assert(listApiKeyResponse.data.head.apiKey.equals(apiKey))
  }

  test("login by api key test") {
    val response: Option[LoginResponse] = apiKeyService.loginByApiKey(apiKey).syncGet()
    assert(response.nonEmpty)
    assert(response.get.userInfo.username.equals(apiKey))
    assert(response.get.session.value.equals(apiKey))
  }

  test("update api key test") {
    val newDisplayName: String = "test_update"
    val newExpiredTime: Long = 10000
    val request = new UpdateApiKeyRequest(
      apiKey = apiKey,
      displayName = newDisplayName,
      expiredTimeMs = Some(newExpiredTime),
      includePermissions = Set("database:*:*"),
      excludePermissions = Set("directory:*:*"),
      request = baseRequest
    )

    val updateOk = apiKeyService.updateApiKey(request).syncGet()
    assert(updateOk)

    val apiKeyPermission: Set[String] =
      apiKeyService
        .getApiKey(new GetApiKeyRequest(apiKey = apiKey, request = baseRequest))
        .syncGet()
        .permissions
    assert(apiKeyPermission.contains("0:database:*:*"))
  }

  test("delete api key test") {
    val isDeleteOk: Boolean = apiKeyService.deleteApiKey(0, apiKey).syncGet()
    assert(isDeleteOk)
  }
  test("create api key added(createdBy,updatedBy,updatedAd) test") {
    val displayName: String = "test_new_api_key"
    val request = new CreateApiKeyRequest(
      displayName = displayName,
      expiredTimeMs = Some(100001),
      permissions = Set("directory:*:*", LicensePermission.ViewData, LicensePermission.EditData),
      request = baseRequest
    )
    val apiKeyResponse: ApiKeyResponse = apiKeyService.create(request).syncGet()
    apiKey = apiKeyResponse.apiKeyInfo.apiKey
    assert(apiKeyResponse.apiKeyInfo.displayName.equals(displayName))
    assert(apiKeyResponse.apiKeyInfo.expiredTimeMs.equals(100001L))
    assert(apiKeyResponse.apiKeyInfo.createdBy.get.equals("root"))
    assert(apiKeyResponse.apiKeyInfo.updatedBy.get.equals("root"))
  }
  test("update api key added(createdBy,updatedBy,updatedAd ) test") {
    val newDisplayName: String = "test_new_update"
    val newExpiredTime: Long = 10000
    val request = new UpdateApiKeyRequest(
      apiKey = apiKey,
      displayName = newDisplayName,
      expiredTimeMs = Some(newExpiredTime),
      includePermissions = Set("database:*:*"),
      excludePermissions = Set("directory:*:*"),
      request = baseRequest
    )

    val updateOk = apiKeyService.updateApiKey(request).syncGet()
    assert(updateOk)

    val recentUpdatedApiKey: ApiKeyResponse =
      apiKeyService
        .getApiKey(new GetApiKeyRequest(apiKey = apiKey, request = baseRequest))
        .syncGet()

    assert(recentUpdatedApiKey.permissions.contains("0:database:*:*"))
    assert(recentUpdatedApiKey.apiKeyInfo.updatedAt > recentUpdatedApiKey.apiKeyInfo.createdAt)
    assert(recentUpdatedApiKey.apiKeyInfo.displayName.equals(newDisplayName))
    assert(recentUpdatedApiKey.apiKeyInfo.expiredTimeMs == newExpiredTime)
  }
}
