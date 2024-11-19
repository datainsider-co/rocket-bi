package co.datainsider.caas.user_profile.repository

import co.datainsider.caas.user_profile.domain.user.{UserGender, UserProfile}
import co.datainsider.caas.user_caas.domain.UserType
import co.datainsider.caas.user_caas.repository.UserRepository
import co.datainsider.caas.user_caas.services.DataInsiderIntegrationTest

/**
  * @author tvc12 - Thien Vi
  * @created 03/13/2021 - 7:35 PM
  */
class UserProfileRepositoryTest extends DataInsiderIntegrationTest {
  private val userProfileRepository: UserProfileRepository = injector.instance[UserProfileRepository]
  private val userRepository: UserRepository = injector.instance[UserRepository]
  private val profile = UserProfile(
    username = "thien_vi",
    fullName = Option("thien vi"),
    firstName = Option("ngoc"),
    lastName = Option("lan"),
    email = Option("meomeocf98@gmail.com"),
    mobilePhone = Option(null),
    gender = Option(UserGender.Male),
    dob = None,
    avatar = Option("https://github.com/tvc12.png"),
    alreadyConfirmed = true,
    properties = Some(Map.empty[String, String]),
    updatedTime = None,
    createdTime = Some(System.currentTimeMillis())
  )

  override def beforeAll(): Unit = {
    super.beforeAll()
    userRepository.deleteUser(organizationId = 1L, username = profile.username)
    userProfileRepository.deleteProfile(1L, profile.username)
    userRepository.insertUser(organizationId = 1L, username = profile.username, passwordHashed = "123456")
  }

  override def afterAll(): Unit = {
    super.afterAll()
    userRepository.deleteUser(organizationId = 1L, username = profile.username)
  }

  test("Add user profile") {
    val r = userProfileRepository.createProfile(1L, profile)
    println("Add user profile::", r)
    assertResult(true)(r)
  }

  test("Get user profile") {
    val r = userProfileRepository.getProfile(1L, profile.username)
    println("Get user profile::", r)
    assertResult(true)(r.isDefined)
  }

  test("Update user profile") {
    val r = userProfileRepository.updateProfile(1L, profile.username, profile.copy(fullName = Some("renamed")))
    println("Get user profile::", r)
    assertResult(true)(r)
  }

  test("Get list users profile") {
    val r = userProfileRepository.getProfiles(1L, Seq(profile.username, "thienlan"))
    println("Get list user profiles::", r)
    assertResult(true)(r.nonEmpty)
  }

  test("Get all users profile") {
    val r = userProfileRepository.getAllUserProfiles(1L)
    println("Get all user profiles::", r)
    assertResult(true)(r.nonEmpty)
  }

  test("Suggest users profile by keyword is email") {
    val keyword = "meomeo"
    val r = userProfileRepository.searchUsers(1L, keyword)
    println("Get all user profiles::", r)
    assertResult(true)(r.data.nonEmpty)
  }

  test("search users profile with user type is none") {
    val keyword = ""
    val r = userProfileRepository.searchUsers(1L, keyword, userType = None)
    println("Get all user profiles::", r)
    assertResult(true)(r.data.nonEmpty)
  }

  test("search users profile with user type is user") {
    val keyword = ""
    val r = userProfileRepository.searchUsers(1L, keyword, userType = Some(UserType.User))
    println("Get all user profiles::", r)
    assertResult(true)(r.data.nonEmpty)
  }

  test("search users profile with user type is api key") {
    val keyword = ""
    val r = userProfileRepository.searchUsers(1L, keyword, userType = Some(UserType.ApiKey))
    println("Get all user profiles::", r)
    assertResult(true)(r.data.isEmpty)
    assertResult(0)(r.data.size)
  }

  test("Suggest users profile by keyword is full name") {
    val keyword = "renamed"
    val r = userProfileRepository.searchUsers(1L, keyword)
    println("Get all user profiles::", r)
    assertResult(true)(r.data.nonEmpty)
  }

  test("Suggest users profile by keyword is first name") {
    val keyword = "ngo"
    val r = userProfileRepository.searchUsers(1L, keyword)
    println("Get all user profiles::", r)
    assertResult(true)(r.data.nonEmpty)
  }

  test("Suggest users profile by keyword is last name") {
    val keyword = "la"
    val r = userProfileRepository.searchUsers(1L, keyword)
    println("Get all user profiles::", r)
    assertResult(true)(r.data.nonEmpty)
  }

  test("Delete user profile") {
    val r = userProfileRepository.deleteProfile(1L, profile.username)
    println("Delete user profiles::", r)
    assertResult(true)(r)
  }
}
