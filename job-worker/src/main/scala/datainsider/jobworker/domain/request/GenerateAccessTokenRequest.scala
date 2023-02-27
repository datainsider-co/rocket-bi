package datainsider.jobworker.domain.request

case class GenerateAccessTokenRequest(secret: String, appId: String, authCode: String)
