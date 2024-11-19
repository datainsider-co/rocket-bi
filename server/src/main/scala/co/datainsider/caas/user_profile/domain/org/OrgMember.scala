package co.datainsider.caas.user_profile.domain.org

@SerialVersionUID(1L)
case class OrgMember(organizationId: Long, username: String, addedBy: String, addedTime: Option[Long] = None)
