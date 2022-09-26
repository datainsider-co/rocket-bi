package datainsider.apikey.repository

import datainsider.apikey.domain.ApiKeyInfo
import datainsider.user_caas.services.DataInsiderIntegrationTest
import datainsider.user_profile.domain.Implicits.FutureEnhanceLike

class ApiKeyRepositoryTest extends DataInsiderIntegrationTest {

  val apiKeyRepository: ApiKeyRepository = injector.instance[ApiKeyRepository]

  val apiKey: String = "di_api_123456"
  val apiKeyInfo: ApiKeyInfo = ApiKeyInfo(
    organizationId = 1L,
    apiKey = apiKey,
    displayName = "api key",
    expiredTimeMs = 5184000000L,
    createdAt = System.currentTimeMillis(),
    updatedAt = System.currentTimeMillis(),
    createdBy = Some("create Actor"),
    updatedBy = Some("create Actor")
  )
  test("insert api key info test") {
    val result: ApiKeyInfo = apiKeyRepository.insert(apiKeyInfo).syncGet()
    assert(apiKeyInfo.equals(result))
  }

  test("get api key info test") {
    val result = apiKeyRepository.get(apiKey).syncGet()
    assert(result.nonEmpty)
    assert(result.get.apiKey.equals(apiKey))
    assert(result.get.equals(apiKeyInfo))
  }

  test("list api key info test") {
    val result = apiKeyRepository.list(1L, "", 0, 20, Seq()).syncGet()
    assert(result.length.equals(1))
    assert(result.head.apiKey.equals(apiKey))
    assert(result.head.equals(apiKeyInfo))
  }

  test("update api key info test") {
    val newDisplayName: String = "test_update"
    val newExpiredTime: Long = 10000
    val result = apiKeyRepository
      .update(
        1,
        apiKey,
        displayName = newDisplayName,
        expiredTimeMs = newExpiredTime,
        updatedBy = "update Actor",
        updatedAt = System.currentTimeMillis()
      )
      .syncGet()
    assert(result)
    val updatedApiKey = apiKeyRepository.get(apiKey).syncGet()
    assert(updatedApiKey.get.displayName.equals(newDisplayName))
    assert(updatedApiKey.get.expiredTimeMs.equals(newExpiredTime))
    assert(updatedApiKey.get.updatedBy.get.equals("update Actor"))
    assert(updatedApiKey.get.updatedAt > updatedApiKey.get.createdAt)
  }

  test("count total api key test") {
    val count = apiKeyRepository.count(1, "").syncGet()
    assert(count.equals(1L))
  }

  test("delete api key info test") {
    val result = apiKeyRepository.delete(1, apiKey).syncGet()
    assert(result)
    assert(apiKeyRepository.get(apiKey).syncGet().isEmpty)
  }

}
