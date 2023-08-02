package co.datainsider.caas.user_caas.domain

import com.fasterxml.jackson.core.`type`.TypeReference

case class OrgStatistics(
    numViewers: Int,
    numEditors: Int
)

object UserGroup extends Enumeration {
  type UserGroup = Value
  val Editor: UserGroup = Value("Editor")
  val Viewer: UserGroup = Value("Viewer")
  val None: UserGroup = Value("None")
}

class UserGroupRef extends TypeReference[UserGroup.type]
