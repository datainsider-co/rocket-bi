package datainsider.apikey.domain.response

import datainsider.apikey.domain.ApiKeyInfo

case class ApiKeyResponse(apiKeyInfo: ApiKeyInfo, permissions: Set[String])

case class ListApiKeyResponse(data: Seq[ApiKeyInfo], total: Long)