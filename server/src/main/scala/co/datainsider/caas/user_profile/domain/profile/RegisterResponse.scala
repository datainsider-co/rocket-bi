package co.datainsider.caas.user_profile.domain.profile

import co.datainsider.caas.user_profile.domain.user.{UserInfo, UserProfile}

/**
  * @author anhlt
  */
case class RegisterResponse(userInfo: UserInfo, userProfile: UserProfile)

case class VerifyForgotPasswordResponse(token: String)
