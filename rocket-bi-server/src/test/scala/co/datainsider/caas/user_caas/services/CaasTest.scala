package co.datainsider.caas.user_caas.services

import co.datainsider.caas.user_profile.domain.user.SessionInfo
import co.datainsider.caas.user_caas.repository.{RoleRepository, UserRepository}
import co.datainsider.caas.user_caas.service.{Caas, CaasService, OrgAuthorizationService, UserService}
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.caas.user_profile.util.JsonParser

/**
  * @author andy
  */
class CaasTest extends DataInsiderIntegrationTest {
  //val sessionDAO = injector.instance[SessionDAO]
  val caas: Caas = injector.instance[Caas]
  val userRepository: UserRepository = injector.instance[UserRepository]
  val roleRepository: RoleRepository = injector.instance[RoleRepository]
  val caasService: CaasService = injector.instance[CaasService]
  val userService: UserService = injector.instance[UserService]
  val orgAuthorizationService: OrgAuthorizationService = injector.instance[OrgAuthorizationService]

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

  val userPermissionDefault = Seq(
    username -> "read",
    username -> "write",
    username -> "dashboard:1:*",
    username -> "dashboard:2:view",
    username -> "dashboard:3:view,edit"
  )

  var currentTime: Long = _

  private def addRolePermissions(organizationId: Long, rolesAndPermissions: Map[Int, Seq[String]]): Unit = {
    for (tuple <- rolesAndPermissions) {
      val roleId = tuple._1
      val permissions = tuple._2.toSet
      roleRepository.addRolePermission(organizationId, roleId, permissions)
      println(s"$roleId with $permissions added")
    }
  }

  private def addPermissions(organizationId: Long, userAndPerms: Seq[(String, String)]): Unit = {
    userAndPerms.foreach {
      case (username, permission) => userRepository.insertUserPermission(organizationId, username, permission)
    }
  }

  override def beforeEach(): Unit = {
    super.beforeEach()
    clearData()
    println("Run init script")

    val userInfo = userService.createUser(0L, username, pass)
    assertResult(true)(userInfo != null)
    roleRepository.insertRoleMap(organizationId, rolesDefault)
    addRolePermissions(organizationId, rolesAndPermissions)
    addPermissions(organizationId, userPermissionDefault)

    println(userInfo)
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

  test("Get username") {
    val user = caas.getUsername(ssid)
    assertResult(user)(username)
    println(s"Username: $user")
  }

  test("Login to organization") {
    val session = caas.loginToOrg(0L, username, pass, 100000)
    val organizationId = session.getAttribute(SessionInfo.ATTR_ORGANIZATION_ID)
    assertResult(organizationId)(0)
    println(s"Organization Id: $organizationId")
    println(s"Old SessionId: $ssid")
    println(s"New SessionId: ${session.getId}")
    println(s"New Session: ${JsonParser.toJson(session)}")

  }

  test("Get username using ssid") {
    val user = caas.getUsername(ssid)
    assertResult(user)(username)
  }

  test("Get username and session using ssid") {
    val (user, session) = caas.getUsernameWithSession(ssid)
    assertResult(user)(username)
    assertResult(session.getId)(ssid)
  }

  test("Get username and session using ssid: 2") {
    val (user, session) = caas.getUsernameWithSession(ssid)
    assertResult(user)(username)
    assertResult(session.getId)(ssid)
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

  test("check permission: has all perms on dashboard 1") {
    assertResult(true)(caas.isPermitted(ssid, "dashboard:1:*"))
  }

  test("check permission: has view,edit on dashboard 3") {
    assertResult(true)(caas.isPermitted(ssid, "dashboard:3:edit,view"))
    assertResult(true)(caas.isPermitted(ssid, "dashboard:3:view,edit"))
    assertResult(true)(caas.isPermitted(ssid, "dashboard:3:view"))
    assertResult(true)(caas.isPermitted(ssid, "dashboard:3:edit"))
  }

  test("Assign permission access database ID: 1") {
    val permission = s"${organizationId}:database:access:1"
    // ensure perm not existed
    val isNotPermit = !caas.isPermitted(organizationId, username, permission)
    assertResult(isNotPermit)(true)
    // add new permission
    val isInserted = userRepository.insertUserPermission(organizationId, username, permission)
    assertResult(isInserted)(true)

    // happy case
    val isPermitted = caas.isPermitted(organizationId, username, permission)
    assertResult(isPermitted)(true)

    // wrong case
    val permissions = Seq(
      "*:database:access:1",
      s"${organizationId}:*:access:1",
      s"${organizationId}:database:*:1",
      s"${organizationId}:database:access:*"
    )
    val results = caas.isPermitted(organizationId, username, permissions: _*)
    val isAllNotPermitted = results.forall(_ == false)
    assertResult(isAllNotPermitted)(true)
  }

  test("Assign permission access * for ID: 2") {
    val permission = s"0:*:access:2"
    // ensure perm not existed
    val isNotPermit = !caas.isPermitted(organizationId, username, permission)
    assertResult(isNotPermit)(true)
    // add new permission
    val isInserted = userRepository.insertUserPermission(organizationId, username, permission)
    assertResult(isInserted)(true)

    // happy case
    val isPermitted = caas
      .isPermitted(organizationId, username, permission, "0:directory:access:2", "0:database:access:2")
      .forall(_ == true)
    assertResult(isPermitted)(true)

    // wrong case
    val permissions =
      Seq("*:database:access:2", s"0:database:*:2", "0:*:access:3", "0:database:access:3", s"0:database:access:*")
    val results = caas.isPermitted(organizationId, username, permissions: _*)
    val isAllNotPermitted = results.forall(_ == false)
    assertResult(isAllNotPermitted)(true)
  }

  test("Assign permission access database for any id") {
    val permission = s"0:database:access:*"
    // ensure perm not existed
    val isNotPermit = !caas.isPermitted(organizationId, username, permission)
    assertResult(isNotPermit)(true)
    // add new permission
    val isInserted = userRepository.insertUserPermission(organizationId, username, permission)
    assertResult(isInserted)(true)

    // happy case
    val isPermitted = caas
      .isPermitted(organizationId, username, permission, "0:database:access:2", "0:database:access:3")
      .forall(_ == true)
    assertResult(isPermitted)(true)

    // wrong case
    val permissions = Seq("*:database:access:2", s"0:database:*:2", "0:*:access:3", "0:database:view:3")
    val results = caas.isPermitted(organizationId, username, permissions: _*)
    val isAllNotPermitted = results.forall(_ == false)
    assertResult(isAllNotPermitted)(true)
  }

  test("Assign permission *:*:*") {
    val permission = s"*:*:*"
    // ensure perm not existed
    val isNotPermit = !caas.isPermitted(organizationId, username, permission)
    assertResult(isNotPermit)(true)
    // add new permission
    val isInserted = userRepository.insertUserPermission(organizationId, username, permission)
    assertResult(isInserted)(true)

    // happy case
    val isPermitted = caas
      .isPermitted(
        organizationId,
        username,
        permission,
        "database:access:2",
        "*:access:3",
        "*:view:*",
        "1:database:access:1",
        "run:database:access:1"
      )
      .forall(_ == true)
    assertResult(isPermitted)(true)
    await(orgAuthorizationService.removePermissions(organizationId, username, Seq(permission)))
  }

  test("Assign permission *:*") {
    val permission = s"*:*"
    // ensure perm not existed
    val isNotPermit = !caas.isPermitted(organizationId, username, permission)
    println(isNotPermit)
    assertResult(isNotPermit)(true)
    // add new permission
    val isInserted = userRepository.insertUserPermission(organizationId, username, permission)
    assertResult(isInserted)(true)

    // happy case
    val isPermitted = caas
      .isPermitted(
        organizationId,
        username,
        permission,
        "database:access:2",
        "*:access:3",
        "*:view:*",
        "1:database:access:1",
        "run:database:access:1"
      )
      .forall(_ == true)
    assertResult(isPermitted)(true)
    await(orgAuthorizationService.removePermissions(organizationId, username, Seq(permission)))
  }

  test("Wildcard 0:*:* match with 0:setting:edit:schema") {
    val permission = s"0:*:*"
    val isNotExistPermission = !caas.isPermitted(organizationId, username, permission)
    assertResult(isNotExistPermission)(true)

    val isInserted = userRepository.insertUserPermission(organizationId, username, permission)
    assertResult(isInserted)(true)
    // true case
    val isPermitted = caas
      .isPermitted(
        organizationId,
        username,
        permission,
        "0:setting:edit:schema",
        "0:setting:edit",
        "0:setting:edit:schema:*",
        "0:*"
      )
      .forall(_ == true)
    assertResult(isPermitted)(true)
    // false case
    val listPermitted = caas.isPermitted(organizationId, username, "1:setting:edit:schema", "1:*", "*")
    listPermitted.foreach(isPermitted => println(s"isPermitted:: $isPermitted"))
    assertResult(listPermitted.forall(_ == false))(true)
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
