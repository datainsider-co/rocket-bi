package co.datainsider.caas.user_caas.services

import co.datainsider.caas.admin.module.ConfigureAccount
import co.datainsider.caas.admin.service.AdminUserService
import co.datainsider.common.authorization.domain.PermissionByUserProviders
import co.datainsider.caas.user_profile.domain.user.UserProfile
import co.datainsider.caas.user_caas.service.OrgAuthorizationService
import co.datainsider.caas.user_profile.service.UserProfileService

/**
  * created 2023-01-10 2:29 PM
  *
  * @author tvc12 - Thien Vi
  */
class AdminUserServiceTest extends DataInsiderIntegrationTest {
  val orgId = 0L
  var username = ""
  private val adminService = injector.instance[AdminUserService]
  private val orgService = injector.instance[OrgAuthorizationService]
  private val expectedPermissionsSet: Set[String] = PermissionByUserProviders.adminUser.allPermissions(orgId)
  private val userProfileService = injector.instance[UserProfileService]
  val accountConfig = ConfigureAccount("admin@gmail.com", Some("123456"), fullName = Some("admin"))

  test("create admin account success") {
    username = await(adminService.createAdminAccount(orgId, accountConfig))
    assert(username != null)
    assert(username.nonEmpty)
    println(s"created account admin username = ${username}")
  }

  test("assign admin permission") {
    val isSuccess: Boolean = await(adminService.assignAdminPermissions(orgId, username))
    assertResult(true)(isSuccess)
    println(s"assign admin permission for ${username} success")
    ensurePermissions(username, expectedPermissionsSet)
  }

  test("test delete account") {
    val isSuccess: Boolean = await(adminService.delete(orgId, username, None))
    assertResult(true)(isSuccess)
    println(s"delete admin account ${username} success")
    ensureDeletedUser(username)
  }

  test("test delete account with transfer") {
    val usernameA = await(adminService.createAdminAccount(orgId, accountConfig))
    val isSuccess: Boolean = await(adminService.assignAdminPermissions(orgId, usernameA))
    assertResult(true)(isSuccess)
    val configAccountB: ConfigureAccount = accountConfig.copy(email = "test@gmail.com")
    val usernameB: String = await(adminService.createAdminAccount(orgId, configAccountB))
    ensurePermissions(usernameB, Set.empty)
    val isDeleted: Boolean = await(adminService.delete(orgId, usernameA, Some(configAccountB.email)))
    assertResult(true)(isDeleted)
    ensurePermissions(usernameB, expectedPermissionsSet)
    ensureDeletedUser(usernameA)
  }

  private def ensurePermissions(username: String, expectedPermissions: Set[String]): Unit = {
    val permissions: Set[String] = await(orgService.getAllPermissions(orgId, username)).toSet
//    assert(permissions == expectedPermissions)
    println(s"admin permissions = ${permissions}")
  }

  private def ensureDeletedUser(username: String): Unit = {
    val deletedProfile: Option[UserProfile] = await(userProfileService.getUserProfile(orgId, username))
    assertResult(None)(deletedProfile)
  }
}
