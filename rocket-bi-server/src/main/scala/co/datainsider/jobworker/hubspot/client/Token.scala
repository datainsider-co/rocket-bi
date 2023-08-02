package co.datainsider.jobworker.hubspot.client

import com.fasterxml.jackson.annotation.JsonProperty

/**
 * Created by phuonglam on 2/16/17.
 **/
case class Token(
  @JsonProperty("refresh_token") refreshToken: String,
  @JsonProperty("access_token") accessToken: String,
  @JsonProperty("expires_in") expiresIn: Int
)

case class AccessToken(@JsonProperty("token") token: String, @JsonProperty("expires_in") expiresIn: Int)

case class RefreshToken()

case class OAuthConfig(clientId: String, clientSecret: String, refreshToken: String, accessToken: Option[String] = None)
