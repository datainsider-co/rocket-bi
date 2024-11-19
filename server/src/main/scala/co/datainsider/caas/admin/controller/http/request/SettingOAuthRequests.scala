package co.datainsider.caas.admin.controller.http.request

import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import com.twitter.finagle.http.Request
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}
import co.datainsider.caas.login_provider.domain.OAuthConfig
import co.datainsider.common.client.util.JsonParser
import com.twitter.finatra.http.annotations.RouteParam

import javax.inject.Inject

case class MultiUpdateOAuthRequest(@Inject request: Request) extends LoggedInRequest {

  lazy val oauthConfigAsMap: Map[String, OAuthConfig] = {
    Option(request.contentString) match {
      case Some(content) => JsonParser.fromJson[Map[String, OAuthConfig]](content)
      case _             => Map.empty
    }
  }

  @MethodValidation(fields = Array("oauthConfigAsMap"))
  def validateOAuthConfig(): ValidationResult = {
    ValidationResult.validate(oauthConfigAsMap.nonEmpty, "OauthConfigs must not empty")
  }

  @MethodValidation()
  def validateWhitelistEmail(): ValidationResult = {
    oauthConfigAsMap.forall {
      case (_, newConfig) => newConfig.isValid()
    } match {
      case true => ValidationResult.Valid()
      case _    => ValidationResult.Invalid("Whitelist email domain incorrect format")
    }
  }

}

case class DeleteOAuthRequest(@RouteParam id: String,@Inject request: Request) extends LoggedInRequest{

}
