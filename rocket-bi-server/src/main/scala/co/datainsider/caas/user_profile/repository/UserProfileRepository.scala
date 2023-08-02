package co.datainsider.caas.user_profile.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.caas.user_profile.domain.user.{UserGender, UserProfile}
import co.datainsider.caas.user_caas.domain.UserType.UserType
import co.datainsider.caas.user_profile.domain.Implicits._
import co.datainsider.caas.user_profile.domain.PagingResult
import co.datainsider.caas.user_profile.util.JsonParser

import java.sql.ResultSet
import scala.collection.mutable

trait UserProfileRepository {

  def createProfile(organizationId: Long, profile: UserProfile): Boolean

  def updateProfile(organizationId: Long, username: String, newProfile: UserProfile): Boolean

  def deleteProfile(organizationId: Long, userId: String): Boolean

  def getProfile(organizationId: Long, userId: String): Option[UserProfile]

  def getProfileByEmail(organizationId: Long, email: String): Option[UserProfile]

  def getProfiles(organizationId: Long, ids: Seq[String]): Map[String, UserProfile]

  def getAllUserProfiles(organizationId: Long): Map[String, UserProfile]

  def searchUsers(
      organizationId: Long,
      keyword: String,
      userType: Option[UserType] = None,
      from: Option[Int] = None,
      size: Option[Int] = None
  ): PagingResult[UserProfile]
}

case class MySqlUserProfileRepository(client: JdbcClient) extends UserProfileRepository {

  override def createProfile(organizationId: Long, profile: UserProfile): Boolean = {
    client.executeUpdate(
      """
        |INSERT INTO caas.user_profile
        |(username, full_name, last_name, first_name, email, mobile_phone, gender, dob, avatar, already_confirmed, properties, updated_time, created_time, organization_id)
        |VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        |""".stripMargin,
      profile.username,
      profile.fullName.getOrElse(""),
      profile.lastName.getOrElse(""),
      profile.firstName.getOrElse(""),
      profile.email.getOrElse(""),
      profile.mobilePhone.getOrElse(""),
      profile.gender.getOrElse(UserGender.Other),
      profile.dob.getOrElse(0L),
      profile.avatar.getOrElse(""),
      profile.alreadyConfirmed.getOrElse(false),
      JsonParser.toJson(profile.properties.getOrElse(Map.empty)),
      System.currentTimeMillis(),
      System.currentTimeMillis(),
      organizationId
    ) > 0
  }

  override def updateProfile(organizationId: Long, username: String, newProfile: UserProfile): Boolean = {
    client.executeUpdate(
      """
        |UPDATE caas.user_profile
        |SET full_name = ?, last_name = ?, first_name = ?, mobile_phone = ?, gender = ?, dob = ?, avatar = ?, already_confirmed = ?, properties = ?, updated_time = ?
        |WHERE organization_id = ? AND username = ?;
        |""".stripMargin,
      newProfile.fullName.getOrElse(""),
      newProfile.lastName.getOrElse(""),
      newProfile.firstName.getOrElse(""),
      newProfile.mobilePhone.getOrElse(","),
      newProfile.gender.getOrElse(UserGender.Other),
      newProfile.dob.getOrElse(0L),
      newProfile.avatar.getOrElse(""),
      newProfile.alreadyConfirmed,
      JsonParser.toJson(newProfile.properties.getOrElse(Map.empty)),
      System.currentTimeMillis(),
      organizationId,
      username
    ) > 0
  }

  override def deleteProfile(organizationId: Long, userId: String): Boolean = {
    client.executeUpdate("""
        |DELETE FROM caas.user_profile
        |WHERE username = ? AND organization_id = ?
        |""".stripMargin, userId, organizationId) >= 0
  }

  private def readAsUserProfile(rs: ResultSet): Option[UserProfile] = {
    rs.next() match {
      case true => Some(parseToProfile(rs))
      case _    => None
    }
  }

  def parseToProfile(rs: ResultSet): UserProfile = {
    val properties = Option(rs.getString("properties")) match {
      case Some(propertiesAsString) => Some(JsonParser.fromJson[Map[String, String]](propertiesAsString))
      case _                        => None
    }
    val dob = rs.getLong("dob") match {
      case 0L      => None
      case r: Long => Some(r)
      case _       => None
    }
    UserProfile(
      username = rs.getString("username"),
      fullName = Option(rs.getString("full_name")),
      firstName = Option(rs.getString("first_name")),
      lastName = Option(rs.getString("last_name")),
      email = Option(rs.getString("email")),
      mobilePhone = Option(rs.getString("mobile_phone")),
      gender = Option(rs.getInt("gender")),
      dob = dob,
      avatar = Option(rs.getString("avatar")),
      alreadyConfirmed = Option(rs.getBoolean("already_confirmed")).getOrElse(false),
      properties = properties,
      updatedTime = Option(rs.getLong("updated_time")),
      createdTime = Option(rs.getLong("created_time"))
    )
  }

  override def getProfile(organizationId: Long, userId: String): Option[UserProfile] = {
    client.executeQuery(
      """
        |SELECT *
        |FROM caas.user_profile
        |WHERE username = ? AND organization_id = ?
        |""".stripMargin,
      userId,
      organizationId
    )(readAsUserProfile)
  }

  override def getProfileByEmail(organizationId: Long, email: String): Option[UserProfile] = {
    client.executeQuery(
      """
        |SELECT *
        |FROM caas.user_profile
        |WHERE email = ? AND organization_id = ?
        |""".stripMargin,
      email,
      organizationId
    )(readAsUserProfile)
  }

  private def readAsUserProfiles(rs: ResultSet): Map[String, UserProfile] = {
    val userProfileAsMap = mutable.HashMap.empty[String, UserProfile]
    while (rs.next()) {
      val userProfile: UserProfile = parseToProfile(rs)
      userProfileAsMap.put(userProfile.username, userProfile)
    }
    userProfileAsMap.toMap
  }

  override def getProfiles(organizationId: Long, ids: Seq[String]): Map[String, UserProfile] = {
    if (ids.isEmpty) {
      Map.empty
    } else {
      client.executeQuery(
        s"""
          |SELECT *
          |FROM caas.user_profile
          |WHERE username in (${Array.fill(ids.size)("?").mkString(",")}) AND organization_id = $organizationId
          |""".stripMargin,
        ids.toArray: _*
      )(readAsUserProfiles)
    }
  }

  override def getAllUserProfiles(organizationId: Long): Map[String, UserProfile] = {
    client.executeQuery("""
        |SELECT *
        |FROM caas.user_profile
        |WHERE organization_id = ?
        |""".stripMargin, organizationId)(readAsUserProfiles)
  }

  private def getUserProfileTable(userType: Option[UserType]): String = {
    if (userType.isEmpty) {
      "caas.user_profile"
    } else {
      s"""
        |(
        | select user_profile.* 
        | from caas.user_profile inner join caas.user on user_profile.username  = user.username
        | where user.user_type = '${userType.get.toString}'
        |)
        |""".stripMargin
    }
  }

  override def searchUsers(
      organizationId: Long,
      keyword: String,
      userType: Option[UserType] = None,
      from: Option[Int],
      size: Option[Int]
  ): PagingResult[UserProfile] = {
    val keywordForEmail = s"%$keyword%"
    val keywordForFullName = s"%$keyword%"
    val keywordForFirstName = s"%$keyword%"
    val keywordForLastName = s"%$keyword%"
    val userProfiles = client.executeQuery(
      s"""
        |SELECT *
        |FROM ${getUserProfileTable(userType)} as user_profile
        |WHERE (email LIKE ? OR full_name LIKE ? OR  first_name LIKE ? OR last_name LIKE ? ) AND already_confirmed = TRUE AND organization_id = ?
        |LIMIT ?, ?
        |""".stripMargin,
      keywordForEmail,
      keywordForFullName,
      keywordForFirstName,
      keywordForLastName,
      organizationId,
      from.getOrElse(0),
      size.getOrElse(20)
    )(readAsUserProfiles)
    val total = getTotalUsers(
      organizationId,
      keywordForEmail,
      keywordForFullName,
      keywordForFirstName,
      keywordForLastName,
      userType
    )

    PagingResult(total, userProfiles.values.toSeq)
  }

  private def getTotalUsers(
      organizationId: Long,
      keywordForEmail: String,
      keywordForFullName: String,
      keywordForFirstName: String,
      keywordForLastName: String,
      userType: Option[UserType] = None
  ): Long = {
    client.executeQuery(
      s"""
        |SELECT COUNT(username)  as total
        |FROM ${getUserProfileTable(userType)} as user_profile
        |WHERE (email LIKE ? OR full_name LIKE ? OR  first_name LIKE ? OR last_name LIKE ? ) AND already_confirmed = TRUE AND organization_id = ?
        |""".stripMargin,
      keywordForEmail,
      keywordForFullName,
      keywordForFirstName,
      keywordForLastName,
      organizationId
    )((rs: ResultSet) => {
      rs.next() match {
        case true => rs.getLong("total")
        case _    => 0L
      }
    })
  }
}
