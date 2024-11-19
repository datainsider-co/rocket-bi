package co.datainsider.caas.login_provider.domain

import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonSubTypes, JsonTypeInfo}
import co.datainsider.caas.user_profile.domain.user.UserProfile

@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[FbOAuthInfo], name = "fb_oauth_info"),
    new Type(value = classOf[GoogleOAuthInfo], name = "google_oauth_info")
  )
)
abstract class OAuthInfo extends Serializable {
  val username: String
  val id: String
  val token: String
  val password: String
  val name: String
  val familyName: Option[String]
  val givenName: Option[String]
  val email: String
  val avatarUrl: String
  val phoneNumber: Option[String]

  def toUserProfile: UserProfile = {
    UserProfile(
      username = username,
      fullName = Some(name),
      lastName = familyName,
      firstName = givenName,
      email = Some(email),
      avatar = Option(avatarUrl),
      alreadyConfirmed = true
    )
  }
}

case class FbOAuthInfo(
    username: String,
    id: String,
    token: String,
    password: String,
    name: String,
    familyName: Option[String],
    givenName: Option[String],
    email: String,
    avatarUrl: String,
    phoneNumber: Option[String] = None
) extends OAuthInfo

case class GoogleOAuthInfo(
    username: String,
    id: String,
    token: String,
    password: String,
    name: String,
    familyName: Option[String],
    givenName: Option[String],
    email: String,
    avatarUrl: String,
    phoneNumber: Option[String] = None
) extends OAuthInfo
