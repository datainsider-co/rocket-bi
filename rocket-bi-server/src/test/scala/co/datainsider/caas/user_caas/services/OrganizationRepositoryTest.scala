package co.datainsider.caas.user_caas.services

import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_caas.repository.UserRepository
import co.datainsider.caas.user_caas.service.UserService
import co.datainsider.caas.user_profile.repository.OrganizationRepository

import java.util.UUID

/**
  * @author andy
  */
class OrganizationRepositoryTest extends DataInsiderIntegrationTest {
  val userRepository: UserRepository = injector.instance[UserRepository]
  val userService: UserService = injector.instance[UserService]
  val organizationRepository: OrganizationRepository = injector.instance[OrganizationRepository]

  val organizationId = 123L
  val username = "tester"
  val createdTime = Some(System.currentTimeMillis())

  override def beforeAll(): Unit = {
    super.beforeAll();
    organizationRepository.deleteOrganization(organizationId)
    userRepository.deleteUser(1L, username)

    val userInfo = userService.createUser(1L, username, "scfdsvfsa")
    assertResult(true)(userInfo != null)
    println(userInfo)
  }

  override def afterAll(): Unit = {
    userRepository.deleteUser(1L, username)
    organizationRepository.deleteOrganization(organizationId)
  }

  def assertOrganization(expectedOrg: Organization, actualOrganization: Option[Organization]): Any = {
    assertResult(actualOrganization.isDefined)(true)
    assert(expectedOrg.organizationId == actualOrganization.get.organizationId)
    assert(expectedOrg.name == actualOrganization.get.name)
    assert(expectedOrg.owner == actualOrganization.get.owner)
    assert(expectedOrg.domain == actualOrganization.get.domain)
    assert(expectedOrg.isActive == actualOrganization.get.isActive)
    assert(expectedOrg.reportTimeZoneId == actualOrganization.get.reportTimeZoneId)
    assert(expectedOrg.thumbnailUrl == actualOrganization.get.thumbnailUrl)
    assert(expectedOrg.licenceKey == actualOrganization.get.licenceKey)
    assert(expectedOrg.createdTime == actualOrganization.get.createdTime)
    assert(expectedOrg.updatedBy == actualOrganization.get.updatedBy)
  }

  test("Insert organization") {
    val expectedOrg = Organization(
      organizationId = organizationId,
      name = "test_org",
      owner = username,
      domain = "hello@gmail.com",
      isActive = true,
      reportTimeZoneId = Some("Asia/ho_chi_minh"),
      thumbnailUrl = Some("https://www.datainsider.co/logo.png"),
      licenceKey = Some(UUID.randomUUID().toString),
      updatedTime = Some(System.currentTimeMillis()),
      createdTime = createdTime,
      updatedBy = None
    )
    val isAdded = organizationRepository.insertOrganization(expectedOrg)
    assertResult(true)(isAdded)
    val actualOrganization = organizationRepository.getOrganization(organizationId)
    assertOrganization(expectedOrg, actualOrganization)
  }

  test("Get organization") {
    val organization: Option[Organization] = organizationRepository.getOrganization(organizationId)
    assertResult(Some(organizationId))(organization.map(_.organizationId))
    println(organization)
  }

  test("Update organization") {
    val newOrganization = Organization(
      organizationId = organizationId,
      name = "test_org",
      owner = username,
      domain = "tvc12.datainsider.co",
      reportTimeZoneId = Some("Asia/ho_chi_minh"),
      isActive = true,
      licenceKey = Some(UUID.randomUUID().toString),
      updatedTime = Some(System.currentTimeMillis()),
      createdTime = createdTime,
      updatedBy = Some("root")
    )
    organizationRepository.update(newOrganization)
    val actualOrganization = organizationRepository.getOrganization(organizationId)
    assertOrganization(newOrganization, actualOrganization)
  }

  test("Delete organization") {
    organizationRepository.deleteOrganization(organizationId)
    val organization: Option[Organization] = organizationRepository.getOrganization(organizationId)
    assertResult(true)(organization.isEmpty)
  }

}
