package co.datainsider.caas.user_profile.domain.user

import co.datainsider.caas.user_profile.domain.org.Organization

@SerialVersionUID(1L)
case class UserInfo(
    username: String,
    roles: Seq[Int] = Seq.empty,
    isActive: Boolean,
    createdTime: Long,
    organization: Option[Organization],
    permissions: Set[String] = Set.empty
)
