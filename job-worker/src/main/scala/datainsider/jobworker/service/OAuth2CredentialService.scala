package datainsider.jobworker.service

import com.google.api.client.auth.oauth2.{BearerToken, ClientParametersAuthentication, Credential}
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport
import com.google.api.client.http.javanet.NetHttpTransport
import com.google.api.client.http.{HttpRequest, HttpRequestInitializer}
import com.google.api.client.json.jackson2.JacksonFactory
import datainsider.client.util.ZConfig


object OAuth2CredentialService {

  private val CLIENT_ID = ZConfig.getString("google.gg_client_id")
  private val CLIENT_SECRET = ZConfig.getString("google.gg_client_secret")

  def buildCredentialFromToken(
      accessToken: String,
      refreshToken: String,
      serverEncodedUrl: String
  ): Credential = {
    // analytics reporting service
    //  - GoogleNetHttpTransport
    //  - JacksonFactory
    //  - OAuth2(access_token, refresh_token)

    val transport: NetHttpTransport = GoogleNetHttpTransport.newTrustedTransport()
    val jsonFactory: JacksonFactory = JacksonFactory.getDefaultInstance

    val credential: Credential = new Credential.Builder(BearerToken.authorizationHeaderAccessMethod())
      .setJsonFactory(jsonFactory)
      .setTransport(transport)
      .setTokenServerEncodedUrl(serverEncodedUrl)
      .setClientAuthentication(new ClientParametersAuthentication(CLIENT_ID, CLIENT_SECRET))
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
}
