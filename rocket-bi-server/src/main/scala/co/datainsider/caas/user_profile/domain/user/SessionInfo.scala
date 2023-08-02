package co.datainsider.caas.user_profile.domain.user

@SerialVersionUID(1L)
case class SessionInfo(
    key: String,
    value: String,
    domain: String,
    maxAgeInMs: Long,
    createdAt: Option[Long],
    path: String = "/"
) {
  val maxAge = maxAgeInMs / 1000L

  val expiredAt = createdAt.getOrElse(System.currentTimeMillis()) + maxAgeInMs
}

/**
  * @author anhlt
  */
object SessionInfo {
  val ATTR_USER = "user"
  val ATTR_ORGANIZATION_ID = "organization_id"
  val ATTR_ORGANIZATION = "organization"

}
