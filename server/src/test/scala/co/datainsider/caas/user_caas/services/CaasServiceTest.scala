package co.datainsider.caas.user_caas.services

import co.datainsider.caas.user_caas.repository.{RoleRepository, UserRepository}
import co.datainsider.caas.user_caas.service.{Caas, CaasService, UserService}

/**
  * @author sonpn
  */
class CaasServiceTest extends DataInsiderIntegrationTest {
  //val sessionDAO: SessionDAO = injector.instance[SessionDAO]
  val caas: Caas = injector.instance[Caas]
  val userRepository: UserRepository = injector.instance[UserRepository]
  val roleRepository: RoleRepository = injector.instance[RoleRepository]
  val caasService: CaasService = injector.instance[CaasService]
  val userService: UserService = injector.instance[UserService]

  val organizationId = 0
  val username: String = "tvc12"
  val pass: String = "123456"
  var ssid: String = _
  var ssidOAuth: String = _

  val rolesDefault = Map(
    12122018 -> "vip",
    12122019 -> "super_vip",
    12122020 -> "super_super_vip"
  )

  val rolesPermissionDefault = Seq(
    12122018 -> "upload:photo",
    12122018 -> "upload:audio",
    12122019 -> "upload:video",
    12122019 -> "upload:photo",
    12122020 -> "upload:*"
  )

  val rolesAndPermissions: Map[Int, Seq[String]] = rolesPermissionDefault
    .groupBy(_._1)
    .map(tuple => tuple._1 -> tuple._2.map(_._2))

  val userPermissionDefault = Seq(username -> "read", username -> "write")

  var currentTime: Long = _

  override def beforeEach(): Unit = {
    super.beforeEach()
    clearData()
    println("Run init script")

    val userInfo = userService.createUser(0L, username, pass)
    roleRepository.insertRoleMap(organizationId, rolesDefault)

    assertResult(true)(userInfo != null)
    println(userInfo)

    for (tuple <- rolesAndPermissions) {
      val roleId = tuple._1
      val permissions = tuple._2.toSet
      roleRepository.addRolePermission(organizationId, roleId, permissions)
      println(s"$roleId with $permissions added")
    }
    for (tuple <- userPermissionDefault) {
      userRepository.insertUserPermission(organizationId, username, tuple._2)
    }
    currentTime = System.currentTimeMillis()
    userRepository.addRole(organizationId, username, 12122018, currentTime + 15 * 1000)
    userRepository.addRole(organizationId, username, 12122019, Long.MaxValue)

    ssid = caas.loginToOrg(0L, username, pass, 100000).getId.toString
    assertResult(true)(ssid != null)
    println(s"ssid: $ssid")
  }

  override def afterEach(): Unit = {
    super.afterEach()
    caas.logout(ssid)

    clearData()
  }

  private def clearData(): Unit = {
    for (tuple <- userPermissionDefault) {
      userRepository.deleteUserPermission(organizationId, username, tuple._2)
    }

    userRepository.removeUserRole(organizationId, username, 12122018)
    userRepository.removeUserRole(organizationId, username, 12122019)

    for (tuple <- rolesAndPermissions) {
      val permissions = tuple._2.toSet
      roleRepository.deleteRolePermission(organizationId, tuple._1, permissions)
    }

    for (elem <- rolesDefault) {
      roleRepository.deleteRole(organizationId, elem._1)
    }

    userRepository.deleteUser(1L, username)
  }

  test("get username by ssid times 1") {
    val user = caas.getUsername(ssid)
    assertResult(user)(username)
    println(s"Username: $user")
  }

  test("get username by ssid times 2") {
    val user: String = caas.getUsername(ssid)
    assertResult(user)(username)
    println(s"Username: $user")
  }

  test("get username by ssid times 3") {
    var user: String = caas.getUsername(ssid)
    user = caas.getUsername(ssid)
    assertResult(user)(username)
    println(s"Username: $user")
  }

  test("check role of user") {
    assertResult(true)(caas.hasRole(ssid, "vip"))
    assertResult(true)(caas.hasRole(ssid, "super_vip"))

    assertResult(false)(caas.hasRole(ssid, "super_super_vip"))
  }

  test("remove role of user and check role again") {
    userRepository.removeUserRole(organizationId, username, 12122018) // delete user vip
    assertResult(false)(caas.hasRole(ssid, "vip"))
  }

  test("check permission: all in one") {
    assertResult(true)(caas.isPermitted(ssid, "read"))
    assertResult(true)(caas.isPermitted(ssid, "write"))
    assertResult(false)(caas.isPermitted(ssid, "upload:*"))

    userRepository.deleteUserPermission(organizationId, username, "write")
    userRepository.removeUserRole(organizationId, username, 12122018) // delete user vip

    assertResult(false)(caas.isPermitted(ssid, "write"))
    assertResult(false)(caas.isPermitted(ssid, "upload:audio"))
  }

  test("check permission: has upload photo") {
    assertResult(true)(caas.isPermitted(ssid, "upload:photo"))
  }
  test("check permission: has upload video") {
    assertResult(true)(caas.isPermitted(ssid, "upload:video"))
  }
  test("check permission: has upload audio") {
    assertResult(true)(caas.isPermitted(ssid, "upload:audio"))
  }

  test("check permission: has read") {
    assertResult(true)(caas.isPermitted(ssid, "read"))
  }

  test("check permission: has write") {

    assertResult(true)(caas.isPermitted(ssid, "write"))
  }

  test("check permission: don't have upload:*") {
    assertResult(false)(caas.isPermitted(ssid, "upload:*"))
  }

  test("check permission: delete vip and write") {
    userRepository.deleteUserPermission(organizationId, username, "write")
    userRepository.removeUserRole(organizationId, username, 12122018) // delete user vip

    assertResult(false)(caas.isPermitted(ssid, "write"))
    assertResult(false)(caas.isPermitted(ssid, "upload:audio"))
  }

  test("Get all username") {
    val users = userRepository.getAllUsername(0L)
    assertResult(true)(users.nonEmpty)
    println(s"${users.size} users: ${users.take(100)}")
  }

  test("Get user info") {
    val user = await(userRepository.getUserInfo(0L, username))
    assertResult(true)(user != null)
    val permissions = user.permissions
    val roleInfos = user.roles
    assertResult(true)(permissions.nonEmpty)
    assertResult(true)(roleInfos.nonEmpty)
    for (roleInfo <- roleInfos) {
      val expectRole = rolesDefault.get(roleInfo.id)

      assertResult(true)(expectRole.isDefined)
      assertResult(expectRole.get)(roleInfo.name)
      println(s"Expire Time: ${roleInfo.expiredTime}")
    }
  }

}
