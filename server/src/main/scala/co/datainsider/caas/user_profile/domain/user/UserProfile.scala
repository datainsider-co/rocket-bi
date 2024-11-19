package co.datainsider.caas.user_profile.domain.user

/**
  * @author anhlt
  */
object UserGender {
  val Other = -1
  val Female = 0
  val Male = 1
}

case class ShortUserProfile(
    username: String,
    fullName: Option[String],
    lastName: Option[String],
    firstName: Option[String],
    gender: Option[Int],
    avatar: Option[String]
)

@SerialVersionUID(1L)
case class UserProfile(
    username: String,
    fullName: Option[String] = None,
    lastName: Option[String] = None,
    firstName: Option[String] = None,
    email: Option[String] = None,
    mobilePhone: Option[String] = None,
    gender: Option[Int] = None,
    dob: Option[Long] = None,
    avatar: Option[String] = None,
    alreadyConfirmed: Boolean = false,
    properties: Option[Map[String, String]] = None,
    updatedTime: Option[Long] = None,
    createdTime: Option[Long] = None
) {
  def toShortUserProfile: ShortUserProfile = {
    ShortUserProfile(
      username = username,
      fullName = fullName,
      lastName = lastName,
      firstName = firstName,
      gender = gender,
      avatar = avatar
    )
  }
}
