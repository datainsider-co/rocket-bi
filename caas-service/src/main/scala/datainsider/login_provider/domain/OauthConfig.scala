package datainsider.login_provider.domain

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import datainsider.user_profile.util.Utils

abstract class MethodValidation {
  def isValid(): Boolean
}

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.EXISTING_PROPERTY,
  property = "oauth_type"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[GoogleOAuthConfig], name = "gg"),
    new Type(value = classOf[FbOAuthConfig], name = "fb")
  )
)
trait OAuthConfig extends MethodValidation {
  val oauthType: String

  val organizationId: Long

  val name: String

  val isActive: Boolean

  val whitelistEmail: Seq[String]

  override def isValid(): Boolean = whitelistEmail.forall(Utils.isValidEmailDomain)
}

case class GoogleOAuthConfig(
    isActive: Boolean,
    whitelistEmail: Seq[String],
    clientIds: Set[String],
    organizationId: Long = 1L
) extends OAuthConfig {
  override val oauthType: String = OAuthType.GOOGLE
  override val name: String = "Google"

  override def isValid(): Boolean = {
    super.isValid() && clientIds.nonEmpty
  }
}

case class FbOAuthConfig(isActive: Boolean, whitelistEmail: Seq[String], appSecret: String, organizationId: Long = 1L)
    extends OAuthConfig {
  override val oauthType: String = OAuthType.FACEBOOK
  override val name: String = "Facebook"
}
