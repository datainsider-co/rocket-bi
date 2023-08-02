package co.datainsider.caas.user_profile.domain.user

@SerialVersionUID(1L)
case class RoleInfo(
    id: Int,
    name: String,
    expiredTime: Long = Long.MaxValue,
    permissions: Set[String] = Set.empty
) {
  def isExpired: Boolean = {
    val currentTime = System.currentTimeMillis
    currentTime > expiredTime
  }
}
