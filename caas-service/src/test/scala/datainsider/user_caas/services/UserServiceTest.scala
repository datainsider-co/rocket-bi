package datainsider.user_caas.services

import datainsider.admin.service.AdminUserService
import datainsider.client.domain.user.{User, UserProfile}
import datainsider.user_caas.domain.{Page, UserType}
import datainsider.user_caas.repository.UserRepository
import datainsider.user_caas.service.UserService
import datainsider.user_profile.domain.profile.UserFullDetailInfo
import datainsider.user_profile.service.UserProfileService

/**
 * created 2022-08-09 6:11 PM
 *
 * @author tvc12 - Thien Vi
 */
class UserServiceTest extends DataInsiderIntegrationTest {
  val userRepository: UserRepository = injector.instance[UserRepository]
  val userService: UserService = injector.instance[UserService]
  val adminService = injector.instance[AdminUserService]
  val profileService = injector.instance[UserProfileService]

  val username = "tvc12"
  val password = "123456"
  val orgId = 0L
  val userProfile = UserProfile(
    username = username,
    fullName = Some("Thien"),
    lastName = Some("Vi"),
    firstName = Some("Chi"),
    email = Some("tvc12@gmail.com"),
    alreadyConfirmed = true,
    updatedTime = Some(System.currentTimeMillis()),
    createdTime = Some( System.currentTimeMillis()),
  )

  override def beforeAll(): Unit = {
    super.beforeAll()
    userRepository.deleteUser(orgId, username)
    println("Run init script")

    val userInfo = userService.createUser(orgId, username, password)
    profileService.createProfile(orgId, userProfile)
    assertResult(true)(userInfo != null)
  }

  test("test getAllUserWithRoleInfo with isActive = None") {
    val users = await(userService.getAllUserWithRoleInfo(orgId, isActive = None, 0, 20))
    assert(users.data.nonEmpty)
  }

  test("test getAllUserWithRoleInfo with isActive = true") {
    val users = await(userService.getAllUserWithRoleInfo(orgId, isActive = Some(true), 0, 20))
    assert(users.data.nonEmpty)
  }

  test("test list users") {
    val users: Seq[User] = await(userService.getListUserByUsernames(orgId, Seq(username)))
    assert(users.nonEmpty)
    println(users)
  }

  test(s"search users by username") {
    val users: Page[UserFullDetailInfo] = await(adminService.searchUsersV2(orgId, "tvc", 0, 20, Some(UserType.User)))
    println(s"search tvc expected ${1}, actual result ${users.total}")
    assert(users.data.nonEmpty)
  }

  test("update user properties") {
    val newProfile = await(adminService.updateUserProperties(orgId, username, Map("firstName" -> "Thien"), Set.empty))
    assert(newProfile.properties.get("firstName") == "Thien")
    val profile: UserFullDetailInfo = await(adminService.getUserFullDetail(orgId, username))
    assert(profile.profile.get.properties.get("firstName") == "Thien")
  }

  test("update user properties, drop properties") {
    val newProfile = await(adminService.updateUserProperties(orgId, username, Map("firstName" -> "Thien", "class" -> "Vi"), Set("firstName")))
    assert(!newProfile.properties.get.contains("firstName"))
    assert(newProfile.properties.get("class") == "Vi")

    val profile: UserFullDetailInfo = await(adminService.getUserFullDetail(orgId, username))
    assert(!profile.profile.get.properties.get.contains("firstName"))
    assert(profile.profile.get.properties.get("class") == "Vi")
  }

  test("update user properties, drop second properties") {
    val _ = await(adminService.updateUserProperties(orgId, username, Map("drop" -> "32", "drop_1" -> "1"),Set.empty))
    val newProfile = await(adminService.updateUserProperties(orgId, username, Map("drop" -> "32", "drop_1" -> "1"),Set("drop")))
    assert(!newProfile.properties.get.contains("drop"))
    assert(newProfile.properties.get("drop_1") == "1")

    val profile: UserFullDetailInfo = await(adminService.getUserFullDetail(orgId, username))
    assert(!profile.profile.get.properties.get.contains("drop"))
    assert(profile.profile.get.properties.get("drop_1") == "1")
  }
}
