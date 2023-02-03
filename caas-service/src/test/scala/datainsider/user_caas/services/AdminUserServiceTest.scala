package datainsider.user_caas.services

import datainsider.admin.module.ConfigureAccount
import datainsider.admin.service.AdminUserService
import datainsider.authorization.domain.PermissionByUserProviders
import datainsider.user_caas.service.OrgAuthorizationService

/**
 * created 2023-01-10 2:29 PM
 *
 * @author tvc12 - Thien Vi
 */
 class AdminUserServiceTest extends DataInsiderIntegrationTest{
  val orgId = 1L
  var username = ""
  private val adminService = injector.instance[AdminUserService]
  private val orgService = injector.instance[OrgAuthorizationService]
  private val expectedAdminPermissionsSet: Set[String] = PermissionByUserProviders.adminUser.allPermissions(orgId).toSet


  test("create admin account success") {
    username = await(adminService.createAdminAccount(orgId, ConfigureAccount("admin@gamil.com", Some("123456"), fullName = Some("admin"))))
    assert(username != null)
    assert(username.nonEmpty)
    println(s"created account admin username = ${username}")
  }

  test("assign admin permission") {
    val isSuccess: Boolean = await(adminService.assignAdminPermissions(orgId, username))
    assertResult(true)(isSuccess)
    println(s"assign admin permission for ${username} success")
    val permissions: Set[String] = await(orgService.getAllPermissions(orgId, username)).toSet
    assert(permissions == expectedAdminPermissionsSet)
    println(s"admin permissions = ${permissions}")
  }
}
