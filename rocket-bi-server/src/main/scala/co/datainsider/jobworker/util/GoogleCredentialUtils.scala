package co.datainsider.jobworker.util

import co.datainsider.jobworker.domain.response.TokenResponse
import com.google.api.client.auth.oauth2.{BearerToken, ClientParametersAuthentication, Credential}
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.googleapis.util.Utils
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.http.{HttpRequest, HttpRequestInitializer}
import com.twitter.util.logging.Logging
import datainsider.client.exception.{BadRequestError, InternalError}
import kong.unirest.Unirest

case class GoogleOAuthConfig(
    clientId: String,
    clientSecret: String,
    redirectUri: String,
    serverEncodedUrl: String
)

object GoogleCredentialUtils extends Logging {

  @throws[BadRequestError]("if error occurs")
  def exchangeToken(authorizationCode: String, googleOAuthConfig: GoogleOAuthConfig): TokenResponse = {
    val response = Unirest
      .post(googleOAuthConfig.serverEncodedUrl)
      .header("content-type", "application/x-www-form-urlencoded")
      .body(
        s"code=$authorizationCode&redirect_uri=${googleOAuthConfig.redirectUri}&client_id=${googleOAuthConfig.clientId}&client_secret=${googleOAuthConfig.clientSecret}&scope=&grant_type=authorization_code"
      )
      .asString()
    val jsonResponse = JsonUtils.fromJson[TokenResponse](response.getBody)
    if (jsonResponse.refreshToken != null)
      jsonResponse
    else
      throw BadRequestError(s"Error: ${response.getBody}")
  }

  def buildCredentialFromToken(
      accessToken: String,
      refreshToken: String,
      googleOAuthConfig: GoogleOAuthConfig
  ): Credential = {

    val transport: NetHttpTransport = GoogleNetHttpTransport.newTrustedTransport()

    val credential: Credential = new Credential.Builder(BearerToken.authorizationHeaderAccessMethod())
      .setJsonFactory(Utils.getDefaultJsonFactory)
      .setTransport(transport)
      .setTokenServerEncodedUrl(googleOAuthConfig.serverEncodedUrl)
      .setClientAuthentication(
        new ClientParametersAuthentication(googleOAuthConfig.clientId, googleOAuthConfig.clientSecret)
      )
      .build()

    credential.setAccessToken(accessToken)
    if (null != refreshToken && refreshToken.nonEmpty) credential.setRefreshToken(refreshToken)
    credential
  }

  def withHttpTimeout(credential: Credential, connTimeoutMs: Int, readTimeoutMs: Int): HttpRequestInitializer = {
    return new HttpRequestInitializer() {
      override def initialize(request: HttpRequest): Unit = {
        credential.initialize(request)
        request.setConnectTimeout(connTimeoutMs)
        request.setReadTimeout(readTimeoutMs)
      }
    }
  }

  def refreshToken(accessToken: String, refreshToken: String, googleOAuthConfig: GoogleOAuthConfig): TokenResponse = {
    try {
      val credential = buildCredentialFromToken(accessToken, refreshToken, googleOAuthConfig)
      require(credential.refreshToken(), "Request refresh token failed")
      TokenResponse(
        accessToken = credential.getAccessToken,
        scope = "",
        tokenType = "Bearer",
        expiresIn = String.valueOf(credential.getExpiresInSeconds),
        refreshToken = credential.getRefreshToken
      )
    } catch {
      case ex: Throwable =>
        logger.error(s"Request refresh token failed, cause ${ex.getMessage}", ex)
        throw InternalError(s"Request refresh token failed, cause ${ex.getMessage}", ex)
    }
  }

}
