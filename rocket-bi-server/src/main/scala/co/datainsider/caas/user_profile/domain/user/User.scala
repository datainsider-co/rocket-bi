package co.datainsider.caas.user_profile.domain.user

import co.datainsider.caas.user_profile.domain.org.Organization

@SerialVersionUID(1L)
case class User(
    username: String,
    password: String,
    isActive: Boolean,
    createdTime: Long,
    roles: Array[RoleInfo] = Array.empty[RoleInfo],
    permissions: Set[String] = Set.empty
) {
  def toUserInfo(): UserInfo = {
    UserInfo(
      username = username,
      organization = None,
      roles = roles.map(_.id),
      permissions = permissions,
      isActive = isActive,
      createdTime = createdTime
    )
  }

  def toUserInfo(organization: Organization): UserInfo = {
    UserInfo(
      username = username,
      organization = Option(organization),
      permissions = permissions,
      roles = roles.map(_.id),
      isActive = isActive,
      createdTime = createdTime
    )
  }
}
