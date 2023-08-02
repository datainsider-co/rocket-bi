package co.datainsider.caas.user_profile.domain.org

/**
  * @author andy
  * @since 8/17/20
  */

@SerialVersionUID(1L)
case class Organization(
    organizationId: Long,
    owner: String,
    name: String,
    domain: String,
    isActive: Boolean,
    reportTimeZoneId: Option[String] = None,
    thumbnailUrl: Option[String] = None,
    createdTime: Option[Long] = None,
    updatedTime: Option[Long] = None,
    updatedBy: Option[String] = None,
    licenceKey: Option[String] = None
)
