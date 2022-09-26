package datainsider.user_profile.domain.profile

import datainsider.client.domain.user.{UserInfo, UserProfile}

/**
  * @author anhlt
  */
case class UserFullDetailInfo(
    user: UserInfo,
    profile: Option[UserProfile]
)
