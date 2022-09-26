package datainsider.user_profile.service

import com.google.inject.name.Named
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.EmailNotExistedError
import datainsider.user_profile.repository.UserIdMapping

import javax.inject.Inject

/**
  * @author andy
  * @author nkthien 08/11/2021 - refactor: remove usage of MappingService to reduce complexity and code dependency, use ProfileService to search for email instead
  */
trait EmailMappingService {

  def mapEmailToUserId(orgId: Long, email: String, username: String): Future[Boolean]

  def removeEmail(orgId: Long, email: String): Future[Boolean]

  def getUserIdByEmail(orgId: Long, email: String): Future[String]

  def findUserIdByEmail(orgId: Long, email: String): Future[Option[String]]
}

case class EmailMappingServiceImpl @Inject() (
    @Named("email_to_user_id_mapping") emailMapping: UserIdMapping
) extends EmailMappingService
    with Logging {

  override def mapEmailToUserId(orgId: Long, email: String, userId: String): Future[Boolean] = {
    emailMapping.add(orgId, email, userId)
  }

  override def removeEmail(orgId: Long, email: String): Future[Boolean] = {
    emailMapping.delete(orgId, email)
  }

  override def getUserIdByEmail(orgId: Long, email: String): Future[String] = {
    findUserIdByEmail(orgId, email).map {
      case Some(username) => username
      case _              => throw EmailNotExistedError(s"No username associated with this email: $email")
    }
  }

  override def findUserIdByEmail(orgId: Long, email: String): Future[Option[String]] = {
    emailMapping.getUserName(orgId, email)
  }

}
