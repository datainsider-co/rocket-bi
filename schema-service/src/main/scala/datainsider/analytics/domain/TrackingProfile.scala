package datainsider.analytics.domain

object ProfileColumnIds {
  val USER_ID = "user_id"
  val TRACKING_ID = "di_tracking_id"
  val FULL_NAME = "full_name"
  val FIRST_NAME = "first_name"
  val LAST_NAME = "last_name"
  val EMAIL = "email"
  val FACEBOOK = "fb"
  val TWITTER = "twitter"
  val ZALO = "zalo"
  val PHONE = "phone"
  val GENDER = "gender"
  val BIRTH_DATE = "birth_date"
  val AVATAR_URL = "avatar_url"
  val UPDATED_TIME = "updated_time"
  val CREATED_TIME = "created_time"
  val FIRST_SEEN_AT = "first_seen_at"
  val LAST_SEEN_AT = "last_seen_at"

  val PROPERTIES = "properties"

  val DEFAULT_PROPERTY_COLLECTION = Set(
    USER_ID,
    TRACKING_ID,
    FULL_NAME,
    FIRST_NAME,
    LAST_NAME,
    EMAIL,
    FACEBOOK,
    TWITTER,
    ZALO,
    PHONE,
    GENDER,
    BIRTH_DATE,
    AVATAR_URL,
    FIRST_SEEN_AT,
    LAST_SEEN_AT,
    UPDATED_TIME,
    CREATED_TIME
  )
}

case class TrackingProfile(
    userId: String,
    trackingId: String,
    fullName: Option[String] = None,
    firstName: Option[String] = None,
    lastName: Option[String] = None,
    email: Option[String] = None,
    fb: Option[String] = None,
    twitter: Option[String] = None,
    zalo: Option[String] = None,
    phone: Option[String] = None,
    gender: Option[String] = None,
    birthDate: Option[Long] = None,
    avatarUrl: Option[String] = None,
    updatedTime: Option[Long] = None,
    createdTime: Option[Long] = None,
    firstSeenAt: Option[Long] = None,
    lastSeenAt: Option[Long] = None,
    properties: Option[Map[String, Any]] = None
)
