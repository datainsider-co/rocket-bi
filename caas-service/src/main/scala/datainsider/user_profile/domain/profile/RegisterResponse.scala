package datainsider.user_profile.domain.profile

import datainsider.client.domain.user.{UserInfo, UserProfile}

/**
  * @author anhlt
  */
case class RegisterResponse(userInfo: UserInfo, userProfile: UserProfile)

case class VerifyForgotPasswordResponse(token: String)
