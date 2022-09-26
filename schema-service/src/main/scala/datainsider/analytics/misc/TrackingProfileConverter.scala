package datainsider.analytics.misc

import com.twitter.inject.Logging
import datainsider.analytics.domain.{ProfileColumnIds, TrackingProfile}
import datainsider.ingestion.domain.{NestedColumn, TableSchema}
import datainsider.ingestion.misc.parser.{ClickHouseDataParser, ColumnParser}
import datainsider.ingestion.misc.JdbcClient.Record

import java.sql.Timestamp

object TrackingProfileConverter extends Logging {

  def toRecord(schema: TableSchema, trackingProfile: TrackingProfile): Record = {
    val record = Seq(
      trackingProfile.userId,
      trackingProfile.trackingId,
      trackingProfile.fullName.getOrElse(""),
      trackingProfile.firstName.getOrElse(""),
      trackingProfile.lastName.getOrElse(""),
      trackingProfile.email.getOrElse(""),
      trackingProfile.fb.getOrElse(""),
      trackingProfile.twitter.getOrElse(""),
      trackingProfile.zalo.getOrElse(""),
      trackingProfile.phone.getOrElse(""),
      trackingProfile.gender.getOrElse(""),
      trackingProfile.birthDate.getOrElse(0L),
      trackingProfile.avatarUrl.getOrElse(""),
      trackingProfile.updatedTime.getOrElse(System.currentTimeMillis()),
      trackingProfile.createdTime.getOrElse(System.currentTimeMillis()),
      trackingProfile.firstSeenAt.getOrElse(System.currentTimeMillis()),
      trackingProfile.lastSeenAt.getOrElse(System.currentTimeMillis()),
      trackingProfile.properties.getOrElse(Map.empty)
    )

    try {
      ClickHouseDataParser(schema).parseCSVRecords(Seq(record)).records.head
    } catch {
      case ex: Exception =>
        error(s"Can't convert tracking profile to insertable row.\n${record}\n${schema}")
        throw ex
    }

  }

  def buildTrackingProfile(userId: String, trackingId: String, properties: Map[String, Any]): TrackingProfile = {
    val normalizedProperties = ColumnDetector.normalizeProperties(properties)
    val extraProperties = normalizedProperties
      .filterNot(entry => ProfileColumnIds.DEFAULT_PROPERTY_COLLECTION.contains(entry._1))

    TrackingProfile(
      userId = userId,
      trackingId = trackingId,
      fullName = normalizedProperties.get(ProfileColumnIds.FULL_NAME).map(_.toString),
      firstName = normalizedProperties.get(ProfileColumnIds.FIRST_NAME).map(_.toString),
      lastName = normalizedProperties.get(ProfileColumnIds.LAST_NAME).map(_.toString),
      email = normalizedProperties.get(ProfileColumnIds.EMAIL).map(_.toString),
      fb = normalizedProperties.get(ProfileColumnIds.FACEBOOK).map(_.toString),
      twitter = normalizedProperties.get(ProfileColumnIds.TWITTER).map(_.toString),
      zalo = normalizedProperties.get(ProfileColumnIds.ZALO).map(_.toString),
      phone = normalizedProperties.get(ProfileColumnIds.PHONE).map(_.toString),
      gender = normalizedProperties.get(ProfileColumnIds.GENDER).map(_.toString),
      birthDate = normalizedProperties.get(ProfileColumnIds.BIRTH_DATE).map(_.toString.toLong),
      avatarUrl = normalizedProperties.get(ProfileColumnIds.AVATAR_URL).map(_.toString),
      firstSeenAt = normalizedProperties.get(ProfileColumnIds.FIRST_SEEN_AT).map(_.toString.toLong),
      lastSeenAt = normalizedProperties.get(ProfileColumnIds.LAST_SEEN_AT).map(_.toString.toLong),
      updatedTime = Some(System.currentTimeMillis()),
      createdTime = None,
      properties = Some(extraProperties)
    )
  }

  def toUpdatedColumnMap(schema: TableSchema, trackingProfile: TrackingProfile): Map[String, Any] = {
    val defaultPropertiesMap = Map[String, Option[Any]](
      ProfileColumnIds.TRACKING_ID -> Option(trackingProfile.trackingId),
      ProfileColumnIds.FULL_NAME -> trackingProfile.fullName,
      ProfileColumnIds.FIRST_NAME -> trackingProfile.firstName,
      ProfileColumnIds.LAST_NAME -> trackingProfile.lastName,
      ProfileColumnIds.EMAIL -> trackingProfile.email,
      ProfileColumnIds.FACEBOOK -> trackingProfile.fb,
      ProfileColumnIds.TWITTER -> trackingProfile.twitter,
      ProfileColumnIds.ZALO -> trackingProfile.zalo,
      ProfileColumnIds.PHONE -> trackingProfile.phone,
      ProfileColumnIds.GENDER -> trackingProfile.gender,
      ProfileColumnIds.BIRTH_DATE -> trackingProfile.birthDate.map(new Timestamp(_)),
      ProfileColumnIds.FIRST_SEEN_AT -> trackingProfile.firstSeenAt.map(new Timestamp(_)),
      ProfileColumnIds.LAST_SEEN_AT -> trackingProfile.lastSeenAt.map(new Timestamp(_)),
      ProfileColumnIds.AVATAR_URL -> trackingProfile.avatarUrl,
      ProfileColumnIds.UPDATED_TIME -> Option(new Timestamp(System.currentTimeMillis()))
    ).filter { case (_, value) => value.isDefined }
      .map { case (name, value) => name -> value.get }

    val extraPropertiesMap = schema.columns
      .filter(_.name == ProfileColumnIds.PROPERTIES)
      .filter(_.isInstanceOf[NestedColumn])
      .map(_.asInstanceOf[NestedColumn])
      .headOption
      .map(buildExtraRecord(trackingProfile, _))
      .getOrElse(Map.empty)

    defaultPropertiesMap ++ extraPropertiesMap
  }

  private def buildExtraRecord(trackingProfile: TrackingProfile, nestedColumn: NestedColumn): Map[String, Any] = {
    val properties = trackingProfile.properties.getOrElse(Map.empty)

    val columnValues = nestedColumn.nestedColumns.map(column =>
      properties
        .get(column.name)
        .map(x => ColumnParser(column).parse(x))
    )

    nestedColumn.nestedColumns
      .zip(columnValues)
      .filter(_._2.isDefined)
      .map(e => e._1 -> e._2.get)
      .map { case (column, value) => s"`${nestedColumn.name}.${column.name}`" -> Seq(value) }
      .toMap

  }

}
