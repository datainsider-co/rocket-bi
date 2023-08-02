package co.datainsider.jobworker.domain.response

case class TokenResponse(accessToken: String, scope: String, tokenType: String, expiresIn: String, refreshToken: String)
