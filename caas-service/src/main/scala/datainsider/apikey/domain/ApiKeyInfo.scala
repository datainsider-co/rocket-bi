package datainsider.apikey.domain

import datainsider.client.domain.user.SessionInfo

case class ApiKeyInfo(
    organizationId: Long,
    apiKey: String,
    displayName: String,
    expiredTimeMs: Long,
    createdAt: Long,
    updatedAt: Long,
    createdBy: Option[String],
    updatedBy: Option[String]
) {
  def toSessionInfo(key: String, domain: String): SessionInfo =
    SessionInfo(key, apiKey, domain, expiredTimeMs, Some(createdAt))
}
