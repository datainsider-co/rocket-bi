package co.datainsider.caas.user_profile.domain.profile

/**
  * @author anhlt
  */
object Roles extends Enumeration {
  val S_ADMIN = Value(10, "sadmin")
  val ADMIN = Value(11, "admin")
  val STAFF = Value(12, "staff")
  val CONTENT_MANAGER = Value(40, "content_manager")
  val CONTENT_MEMBER = Value(41, "content_member")
  val SADMIN_ADMIN_IDS = Seq(S_ADMIN.id, ADMIN.id)
}
