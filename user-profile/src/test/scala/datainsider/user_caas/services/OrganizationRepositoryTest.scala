package datainsider.user_caas.services

import com.twitter.inject.app.TestInjector
import com.twitter.inject.{Injector, IntegrationTest}
import datainsider.client.domain.org.Organization
import datainsider.user_profile.module.{DBModule, UserProfileModule}
import datainsider.user_profile.repository.OrganizationRepository
import org.scalatest.BeforeAndAfterAll
import datainsider.user_caas.module.CaasModule
import datainsider.user_caas.repository.UserRepository
import datainsider.user_caas.service.UserService
import datainsider.user_profile.TestServer

/**
  * @author andy
  */
class OrganizationRepositoryTest extends DataInsiderIntegrationTest {
  val userRepository: UserRepository = injector.instance[UserRepository]
  val userService: UserService = injector.instance[UserService]
  val organizationRepository: OrganizationRepository = injector.instance[OrganizationRepository]

  val organizationId = 123L
  val username = "tester"

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

  test("Insert org") {
    val organization = Organization(
      organizationId = organizationId,
      name = "test_org",
      owner = username,
      domain = "hello@gmail.com",
      isActive = true
    )
    val added = organizationRepository.insertOrganization(organization)
    assertResult(true)(added)
  }

  test("Get org") {
    val org = organizationRepository.getOrganization(organizationId)
    assertResult(Some(organizationId))(org.map(_.organizationId))
    println(org)
  }

  test("Delete org") {
    organizationRepository.deleteOrganization(organizationId)
    val org = organizationRepository.getOrganization(organizationId)
    assertResult(true)(org.isEmpty)
  }

}
