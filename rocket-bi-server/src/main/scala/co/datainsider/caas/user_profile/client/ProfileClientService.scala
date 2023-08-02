package co.datainsider.caas.user_profile.client

import co.datainsider.caas.admin.service.AdminUserService
import co.datainsider.caas.user_profile.service.UserProfileService
import com.google.inject.Inject
import com.twitter.util.Future
import co.datainsider.caas.user_profile.domain.user.UserProfile

import scala.collection.Map

trait ProfileClientService {

  def getUserProfile(organizationId: Long, username: String): Future[Option[UserProfile]]

  def getUserProfiles(organizationId: Long, usernames: Seq[String]): Future[Map[String, UserProfile]]

  def getProfileByEmail(organizationId: Long, email: String): Future[Option[UserProfile]]

  def deleteUser(organizationId: Long, username: String, transferToEmail: Option[String] = None): Future[Boolean]
}

class ProfileClientServiceImpl @Inject() (
    profileService: UserProfileService,
    adminService: AdminUserService
) extends ProfileClientService {

  override def getUserProfile(organizationId: Long, username: String): Future[Option[UserProfile]] = {
    profileService.getUserProfile(organizationId, username)
  }

  override def getUserProfiles(organizationId: Long, usernames: Seq[String]): Future[Map[String, UserProfile]] = {
    profileService.getUserProfiles(organizationId, usernames)
  }

  override def getProfileByEmail(organizationId: Long, email: String): Future[Option[UserProfile]] = {
    profileService.getUserProfileByEmail(organizationId, email).map(profile => Some(profile)).rescue {
      case e: Throwable => Future.None
    }
  }

  override def deleteUser(organizationId: Long, username: String, transferToEmail: Option[String]): Future[Boolean] = {
    adminService.delete(organizationId, username, transferToEmail)
  }
}

case class MockProfileClientServiceImpl() extends ProfileClientService {

  override def getUserProfile(organizationId: Long, username: String): Future[Option[UserProfile]] = {
    Future.value(
      Some(
        UserProfile(
          username = username,
          lastName = Some("Nguyen"),
          firstName = Some("Na"),
          fullName = Some(s"Nguyen Na"),
          email = Some(s"${System.currentTimeMillis()}@gmail.com")
        )
      )
    )
  }

  override def getUserProfiles(organizationId: Long, usernames: Seq[String]): Future[Map[String, UserProfile]] = {

    val profileMap = usernames
      .map(username => {
        username -> UserProfile(
          username = username,
          lastName = Some("Nguyen"),
          firstName = Some("Na"),
          fullName = Some(s"Nguyen Na"),
          email = Some(s"${System.currentTimeMillis()}@gmail.com")
        )
      })
      .toMap

    Future.value(profileMap)

  }

  override def getProfileByEmail(organizationId: Long, email: String): Future[Option[UserProfile]] = {
    Future.value(
      Some(
        UserProfile(
          username = "andy",
          lastName = Some("Nguyen"),
          firstName = Some("Na"),
          fullName = Some(s"Nguyen Na"),
          email = Some(s"${System.currentTimeMillis()}@gmail.com")
        )
      )
    )
  }

  override def deleteUser(organizationId: Long, username: String, transferToEmail: Option[String]): Future[Boolean] =
    Future.True
}
