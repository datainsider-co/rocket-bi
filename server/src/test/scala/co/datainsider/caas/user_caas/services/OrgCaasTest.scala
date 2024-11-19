package co.datainsider.caas.user_caas.services

import co.datainsider.caas.user_profile.domain.user.SessionInfo
import co.datainsider.caas.user_caas.repository.{RoleRepository, UserRepository}
import co.datainsider.caas.user_caas.service.{Caas, CaasService, UserService}
import co.datainsider.bi.util.Implicits.FutureEnhance
import co.datainsider.caas.user_profile.util.JsonParser

/**
  * @author andy
  */
class OrgCaasTest extends DataInsiderIntegrationTest {
  val caas: Caas = injector.instance[Caas]
  val userRepository: UserRepository = injector.instance[UserRepository]
  val roleRepository: RoleRepository = injector.instance[RoleRepository]
  val caasService: CaasService = injector.instance[CaasService]
  val userService: UserService = injector.instance[UserService]

  val organizationId = 0L
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

    val session = caas.loginToOrg(0L, username, pass, 100000)
    ssid = session.getId.toString
    assertResult(true)(ssid != null)

    assertResult(session.getAttribute(SessionInfo.ATTR_ORGANIZATION_ID))(organizationId)
    println(s"Old SessionId: $ssid")
    println(s"New SessionId: ${session.getId}")
    println(s"New Session: ${JsonParser.toJson(session)}")
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

    userRepository.deleteUser(0L, username)
  }

  test("get username") {
    val user = caas.getUsername(ssid)
    assertResult(user)(username)
    println(s"Username: $user")
  }

  test("Set session attribute") {
    caas.setSessionAttribute(0L, ssid, "organization_id", "datainsider")
    val session = caas.getSession(ssid)
    val organizationId = session.getAttribute("organization_id")
    assertResult(organizationId)("datainsider")
    println(s"Organization Id: $organizationId")

  }

  test("get username: 2") {
    val user = caas.getUsername(ssid)
    assertResult(user)(username)
    println(s"Username: $user")
  }

  test("get username: 3") {
    val (username, session) = caas.getUsernameWithSession(ssid)
    assertResult(username)(username)

    println(s"Username: $username")
    println(s"Session: ${JsonParser.toJson(session)}")

  }

  test("get username: 4") {
    val (username, session) = caas.getUsernameWithSession(ssid)
    assertResult(username)(username)

    println(s"Username: $username")
    println(s"Session: ${JsonParser.toJson(session)}")

  }

  test("check role") {
    assertResult(true)(caas.hasRole(ssid, "vip"))
    assertResult(true)(caas.hasRole(ssid, "super_vip"))

    assertResult(false)(caas.hasRole(ssid, "super_super_vip"))
  }

  test("vip role must Exists") {
    assertResult(true)(caas.hasRole(ssid, "vip"))
  }

  test("vip role must NOT FOUND after deletion") {
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

  test("check permission: dont have upload:*") {
    assertResult(false)(caas.isPermitted(ssid, "upload:*"))
  }

  test("check permission: delete vip and write") {
    userRepository.deleteUserPermission(organizationId, username, "write")
    userRepository.removeUserRole(organizationId, username, 12122018) // delete user vip

    assertResult(false)(caas.isPermitted(ssid, "write"))
    assertResult(false)(caas.isPermitted(ssid, "upload:audio"))
  }

  test("Get all user name") {
    val users = userRepository.getAllUsername(0L)
    assertResult(true)(users.nonEmpty)
    println(s"${users.size} users: ${users.take(100)}")
  }

  test("Get user info") {
    val user = userRepository.getUserInfo(0L, username).syncGet()
    assertResult(true)(user != null)
    println(s"User: ${JsonParser.toJson(user)}")
    println(s"User roles: ${JsonParser.toJson(user.roles)}")
    println(s"User perms: ${JsonParser.toJson(user.permissions)}")
  }

}
