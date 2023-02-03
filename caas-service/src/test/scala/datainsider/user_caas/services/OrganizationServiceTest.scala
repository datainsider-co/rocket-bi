package datainsider.user_caas.services

import datainsider.client.domain.org.Organization
import datainsider.user_caas.repository.UserRepository
import datainsider.user_caas.service.UserService
import datainsider.user_profile.controller.http.request.CreateOrganizationRequest
import datainsider.user_profile.domain.Implicits.FutureEnhanceLike
import datainsider.user_profile.service.OrganizationService

/**
  * @author andy
  */
class OrganizationServiceTest extends DataInsiderIntegrationTest {
  val userRepository: UserRepository = injector.instance[UserRepository]
  val userService: UserService = injector.instance[UserService]
  val organizationService: OrganizationService = injector.instance[OrganizationService]

  var organizationId: Long = 0L
  val username = "tester"

  override def beforeAll(): Unit = {
    super.beforeAll()
    userRepository.deleteUser(1L, username)

    val userInfo = userService.createUser(1L, username, "scfdsvfsa").syncGet()
    assertResult(true)(userInfo != null)
    println(userInfo)
  }

  override def afterAll(): Unit = {
    super.afterAll()
    try {
      userRepository.deleteUser(1L, username)
      await(organizationService.deleteOrganization(organizationId))
    } catch {
      case ex: Throwable => error("OrganizationServiceTest::afterAll::error", ex)
    }
  }

  test("Create org") {
    val request = CreateOrganizationRequest(
      organizationId = 1L,
      name = "test_org",
      owner = username,
      domain = "test.datainsider.co",
      isActive = true,
      reportTimeZoneId = None,
      thumbnailUrl = None,
      createdTime = System.currentTimeMillis()
    )
    val organization = organizationService.createOrganization(request).syncGet()
    assertResult(true)(organization != null)

    organizationId = organization.organizationId
  }

  test("Get org") {
    val organization = organizationService.getOrganization(organizationId).syncGet()
    assertResult(Some(organizationId))(organization.map(_.organizationId))
    println(organization)
  }

  test("update organization meta data") {
    val _ = await(organizationService.update(organizationId, "test company", "https://url.com/test.png", "tvc12"))
    val newCompany: Option[Organization] = await(organizationService.getOrganization(organizationId))
    assert(newCompany.isDefined)
    assert(newCompany.get.name == "test company")
    assert(newCompany.get.thumbnailUrl.isDefined)
    assert(newCompany.get.thumbnailUrl.get == "https://url.com/test.png")
  }

  // This function has been comment
//  test("Get organization id by username") {
//    val organizationIds = organizationService.getJoinedOrganizationIds(username).syncGet()
//    assertResult(true)(organizationIds.nonEmpty)
//    println(organizationIds)
//  }

  // todo: fix dns error
//  test("Delete org") {
//    organizationService.deleteOrganization(organizationId).syncGet()
//    val org = organizationService.getOrganization(organizationId).syncGet()
//    assertResult(true)(org.isEmpty)
//  }

}
