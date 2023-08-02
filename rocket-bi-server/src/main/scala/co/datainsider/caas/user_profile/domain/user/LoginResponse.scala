package co.datainsider.caas.user_profile.domain.user

import co.datainsider.caas.user_profile.domain.org.Organization

case class LoginResult(
    session: SessionInfo,
    user: User,
    properties: Option[Map[String, Any]]
) {
  def getOrganizationId(): Option[Long] = {
    properties
      .flatMap(_.get(SessionInfo.ATTR_ORGANIZATION_ID))
      .filter(x => x.isInstanceOf[Int] || x.isInstanceOf[Long])
      .map(_.toString.toLong)
  }

  def getOrganization(): Option[Organization] = {
    properties
      .flatMap(_.get(SessionInfo.ATTR_ORGANIZATION))
      .filter(_.isInstanceOf[Organization])
      .map(_.asInstanceOf[Organization])
  }

  def buildUserInfo(): UserInfo = {
    user.toUserInfo()
  }

  def buildUserInfo(organization: Organization): UserInfo = {
    user.toUserInfo(organization)
  }

}

case class LoginResponse(
    session: SessionInfo,
    userInfo: UserInfo,
    userProfile: Option[UserProfile] = None
)
