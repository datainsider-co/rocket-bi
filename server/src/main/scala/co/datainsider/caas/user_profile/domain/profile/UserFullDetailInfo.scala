package co.datainsider.caas.user_profile.domain.profile

import co.datainsider.caas.user_caas.domain.UserGroup.UserGroup
import co.datainsider.caas.user_caas.domain.UserGroupRef
import co.datainsider.caas.user_profile.domain.user.{UserInfo, UserProfile}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

/**
  * @author anhlt
  */
case class UserFullDetailInfo(
    user: UserInfo,
    profile: Option[UserProfile],
    @JsonScalaEnumeration(classOf[UserGroupRef])
    userGroup: Option[UserGroup] = None
)
