package co.datainsider.caas.apikey.domain.response

import co.datainsider.caas.apikey.domain.ApiKeyInfo

case class ApiKeyResponse(apiKeyInfo: ApiKeyInfo, permissions: Set[String])

case class ListApiKeyResponse(data: Seq[ApiKeyInfo], total: Long)
