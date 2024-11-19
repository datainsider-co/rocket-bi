package co.datainsider.caas.user_profile.client

import co.datainsider.caas.user_caas.domain.Page
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.service.OrganizationService
import co.datainsider.common.client.exception.BadRequestError
import com.google.inject.Inject
import com.twitter.util.Future
trait OrgClientService {

  def isExists(organizationId: Long): Future[Boolean]

  def getOrganization(organizationId: Long): Future[Organization]

  def getOrganizations(organizationIds: Seq[Long]): Future[Map[Long, Organization]]

  def isOrganizationMember(organizationId: Long, username: String): Future[Boolean]

  def getAllOrganizations(from: Int, size: Int): Future[Page[Organization]]

  def getWithDomain(domain: String): Future[Organization]
}

class OrgClientServiceImpl @Inject() (organizationService: OrganizationService) extends OrgClientService {
  override def isExists(organizationId: Long): Future[Boolean] = {
    organizationService.isExists(organizationId)
  }

  override def getOrganization(organizationId: Long): Future[Organization] = {
    organizationService.getOrganization(organizationId).map {
      case Some(org) => org
      case None      => throw BadRequestError(s"not found org with id $organizationId")
    }
  }

  override def getOrganizations(organizationIds: Seq[Long]): Future[Map[Long, Organization]] = {
    organizationService.getOrganizations(organizationIds)
  }

  override def isOrganizationMember(organizationId: Long, username: String): Future[Boolean] = {
    organizationService.isOrganizationMember(organizationId, username)
  }

  override def getAllOrganizations(from: Int, size: Int): Future[Page[Organization]] = {
    organizationService.getAllOrganizations(from, size)
  }

  override def getWithDomain(domain: String): Future[Organization] = {
    organizationService.getByDomain(domain)
  }
}

case class MockOrgClientServiceImpl() extends OrgClientService {

  override def isExists(organizationId: Long) = {
    Future.True
  }

  override def getOrganization(organizationId: Long): Future[Organization] = {
    Future.value(
      Organization(
        organizationId,
        "system",
        "Data Insider",
        "dev.datainsider.co",
        isActive = true,
        createdTime = Some(System.currentTimeMillis()),
        updatedTime = Some(System.currentTimeMillis()),
        updatedBy = Some("ADMIN"),
        licenceKey = "ROOT_LICENCE_KEY"
      )
    )
  }

  override def getOrganizations(organizationIds: Seq[Long]): Future[Map[Long, Organization]] = {
    val organizations = organizationIds
      .map(organizationId => {
        organizationId -> Organization(
          organizationId,
          "system",
          "Data Insider",
          "dev.datainsider.co",
          isActive = true,
          createdTime = Some(System.currentTimeMillis()),
          updatedTime = Some(System.currentTimeMillis()),
          updatedBy = Some("ADMIN"),
          licenceKey = "ROOT_LICENCE_KEY"
        )
      })
      .toMap

    Future.value(organizations)
  }

  override def isOrganizationMember(organizationId: Long, username: String): Future[Boolean] = {
    Future.True
  }

  override def getAllOrganizations(from: Int, size: Int): Future[Page[Organization]] = {
    Future.value(Page(0, Seq.empty[Organization]))
  }

  override def getWithDomain(domain: String): Future[Organization] = {
    Future.value(
      Organization(
        0L,
        "system",
        "Data Insider",
        "dev.datainsider.co",
        isActive = true,
        createdTime = Some(System.currentTimeMillis()),
        updatedTime = ???,
        updatedBy = ???,
        licenceKey = ???
      )
    )
  }
}
