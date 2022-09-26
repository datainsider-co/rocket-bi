package datainsider.user_profile.controller.http.request

import com.fasterxml.jackson.annotation.JsonProperty
import com.twitter.finagle.http.Request
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.domain.user.UserProfile
import datainsider.client.filter.LoggedInRequest
import datainsider.login_provider.domain.OAuthType
import datainsider.user_profile.controller.http.filter.email.EmailContextRequest
import datainsider.user_profile.util.Utils
import datainsider.user_caas.domain.PasswordMode.PasswordMode

import java.util.UUID
import javax.inject.Inject

/**
  * @author sonpn
  */
case class RegisterUserRequestBody(
    email: String,
    password: String,
    @JsonProperty("full_name") fullName: String,
    @JsonProperty("first_name") firstName: Option[String],
    @JsonProperty("last_name") lastName: Option[String]
)

case class ForgetPasswordRequestBody(
    email: String,
    @JsonProperty("new_password") newPassword: String,
    @JsonProperty("email_token") emailToken: String
)

case class RegisterUserViaSocialNetworkRequestBody(
    @JsonProperty("phone_token") phoneToken: Option[String],
    @JsonProperty("oauth_type") oauthType: String,
    id: String,
    token: String,
    @JsonProperty("phone_number") phoneNumber: Option[String],
    @JsonProperty("verify_code") verifyCode: Option[String],
    password: String
) {

  val normalizedPhoneNumber: Option[String] = phoneNumber match {
    case Some(x) => Some(Utils.normalizePhoneNumber(x))
    case _       => None
  }
}

case class UserOAuthRequestBody(@JsonProperty("oauth_type") oauthType: String, id: String, token: String)

case class UpdatePhoneRequestBody(
    @JsonProperty("phone_number") phoneNumber: String,
    @JsonProperty("verify_code") verifyCode: String
) {
  val normalizedPhoneNumber = Utils.normalizePhoneNumber(phoneNumber)
}

case class UpdateEmailBodyRequest(email: String)

case class UpdateNameRequest(name: String, @Inject request: Request)

case class RegisterRequest(
    @NotEmpty email: String,
    @NotEmpty password: String,
    @NotEmpty fullName: String,
    firstName: Option[String] = None,
    lastName: Option[String] = None,
    gender: Option[Int] = None,
    dob: Option[Long] = None,
    nationality: Option[String] = None,
    nativeLanguages: Option[Seq[String]] = None,
    isVerifyEnabled: Option[Boolean] = None,
    passwordMode: Option[PasswordMode] = None,
    avatarUrl: Option[String] = None,
    @Inject request: Request = null
) extends EmailContextRequest {

  override def getEmail(): String = email

  def buildUserProfile(): UserProfile = {
    UserProfile(
      username = s"${OAuthType.UP}-${UUID.randomUUID().toString}",
      email = Some(email),
      fullName = Some(fullName),
      firstName = firstName,
      lastName = lastName,
      alreadyConfirmed = !isVerifyEnabled.getOrElse(true),
      gender = gender,
      dob = dob,
      updatedTime = Some(System.currentTimeMillis()),
      createdTime = Some(System.currentTimeMillis()),
      avatar = avatarUrl
    )
  }

}

case class EditProfileRequest(
    fullName: Option[String] = None,
    lastName: Option[String] = None,
    firstName: Option[String] = None,
    mobilePhone: Option[String] = None,
    gender: Option[Int] = None,
    dob: Option[Long] = None,
    avatar: Option[String] = None,
    alreadyConfirmed: Option[Boolean] = None,
    @Inject request: Request = null
) extends LoggedInRequest {
  def buildFrom(currentProfile: UserProfile): UserProfile = {
    UserProfile(
      username = currentProfile.username,
      email = currentProfile.email,
      fullName = fullName.orElse(currentProfile.fullName),
      firstName = firstName.orElse(currentProfile.firstName),
      lastName = lastName.orElse(currentProfile.lastName),
      mobilePhone = mobilePhone.orElse(currentProfile.mobilePhone),
      gender = gender.orElse(currentProfile.gender),
      dob = dob.orElse(currentProfile.dob),
      avatar = avatar.orElse(currentProfile.avatar),
      alreadyConfirmed = alreadyConfirmed.getOrElse(currentProfile.alreadyConfirmed),
      properties = currentProfile.properties,
      updatedTime = Some(System.currentTimeMillis()),
      createdTime = currentProfile.createdTime.orElse(Some(System.currentTimeMillis()))
    )
  }
}

case class ChangeUserPasswordRequest(
    oldPass: String,
    newPass: String,
    @Inject request: Request
) extends LoggedInRequest
