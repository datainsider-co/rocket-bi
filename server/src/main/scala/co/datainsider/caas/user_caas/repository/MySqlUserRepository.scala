package co.datainsider.caas.user_caas.repository

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.client.JdbcClient.Record
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.caas.user_profile.domain.user.{RoleInfo, User}
import co.datainsider.caas.user_caas.domain.{Page, UserType}
import co.datainsider.caas.user_caas.domain.UserType.UserType

import java.sql.{ResultSet, SQLException}
import scala.collection.mutable
import scala.collection.mutable.ListBuffer

object MySqlUserRepository {
  private val SQL_INSER_USER =
    "INSERT INTO caas.user (username, password, is_active, created_time, organization_id, user_type) VALUES (?, ?, ?, ?, ?, ?)"
  private val SQL_SELECT_USER =
    "SELECT username, password, is_active, created_time FROM caas.user WHERE username=? AND organization_id=?"
  private val SQL_SELECT_USER_PASS =
    "SELECT is_active FROM caas.user WHERE username=? AND password=? AND organization_id=?"
  private val SQL_SELECT_USER_ACTIVE_STATUS = "SELECT is_active FROM caas.user WHERE username=? AND organization_id=?"
  private val SQL_SELECT_ALL_USER =
    "SELECT username FROM caas.user WHERE organization_id=? AND user_type=? ORDER BY username ASC"
  private val SQL_SELECT_ALL_USER_INFO =
    """
      |SELECT user.username, user.is_active, user.created_time, role.role_id, role.role_name, user_roles.expired_time
      |FROM ( SELECT DISTINCT username, is_active, created_time FROM caas.user %s) AS user
      |LEFT JOIN caas.user_roles ON user.username=user_roles.username
      |LEFT JOIN caas.role ON user_roles.role_id=role.role_id
      |ORDER BY user.created_time DESC
      |""".stripMargin
  private val SQL_COUNT_ALL_USER_INFO = "SELECT COUNT(username) FROM caas.user WHERE organization_id=? AND user_type=?"
  private val SQL_SEARCH_ALL_USER_INFO =
    """
      |SELECT user.username, user.is_active, user.created_time, role.role_id, role.role_name, user_roles.expired_time
      |FROM ( SELECT DISTINCT username, is_active, created_time FROM caas.user WHERE user_type=? AND username LIKE ? %s) AS user
      |LEFT JOIN caas.user_roles ON user.username = user_roles.username
      |LEFT JOIN caas.role ON user_roles.role_id = role.role_id
      |WHERE user.organization_id=?
      |ORDER BY user.username ASC
      |""".stripMargin
  private val SQL_COUNT_SEARCH_ALL_USER_INFO =
    "SELECT COUNT(DISTINCT username) FROM caas.user WHERE username LIKE ? AND organization_id=? AND user_type=?"
  private val SQL_SELECT_ALL_USER_INFO_WITH_HIGHEST_ROLE_FILTER =
    """
      |SELECT user.username, user.is_active, user.created_time, role.role_id, role.role_name, user_roles.expired_time
      |FROM (SELECT DISTINCT user.username, user.is_active, user.created_time FROM caas.user %s %s) AS user
      |LEFT JOIN caas.user_roles ON user.username=user_roles.username
      |LEFT JOIN caas.role ON user_roles.role_id=role.role_id
      |ORDER BY user.username ASC
      |""".stripMargin
  private val SQL_NOT_IN_ROLE =
    "user.username NOT IN (SELECT username FROM caas.user_roles WHERE organization_id=%s AND role_id IN (%s))"
  private val SQL_IN_ROLE =
    "user.username IN (SELECT username FROM caas.user_roles WHERE organization_id=%s AND role_id IN (%s))"
  private val SQL_COUNT_ALL_USER_INFO_WITH_HIGHEST_ROLE_FILTER =
    "SELECT COUNT(DISTINCT user.username) FROM caas.user %s "
  private val SQL_SEARCH_ALL_USER_INFO_WITH_HIGHEST_ROLE_FILTER =
    """
      |SELECT user.username, user.is_active, user.created_time, role.role_id, role.role_name, user_roles.expired_time
      |FROM (
      | SELECT DISTINCT user.username, user.is_active, user.created_time
      | FROM caas.user
      | WHERE user_type=? user.username LIKE ? %s %s
      |) AS user
      |LEFT JOIN caas.user_roles ON user.username = user_roles.username
      |LEFT JOIN caas.role ON user_roles.role_id = role.role_id
      |ORDER BY user.username ASC
      |""".stripMargin
  private val SQL_COUNT_SEARCH_ALL_USER_INFO_WITH_HIGHEST_ROLE_FILTER =
    "SELECT COUNT( DISTINCT user.username) FROM caas.user WHERE user.username LIKE ? %s"
  private val SQL_IS_PASSWORD = "SELECT username FROM caas.user WHERE username=? and password =? AND organization_id=?"
  private val SQL_SET_USER_PASS = "UPDATE caas.user SET password=? WHERE username=? AND organization_id=?"
  private val SQL_UPDATE_USER_INFO = "UPDATE caas.user SET is_active=? WHERE username=? AND organization_id=?"
  private val SQL_UPDATE_ACTIVE_STATUS = "UPDATE caas.user SET is_active=? WHERE username=? AND organization_id=?"
  private val SQL_DELETE_USER = "DELETE FROM caas.user WHERE username=? AND organization_id=?"
  private val SQL_INSERT_USER_PERM =
    "INSERT INTO caas.user_permissions (organization_id, username, permission) VALUES (?, ?, ?) "
  private val ON_UPDATE_DUPLICATE_USER_PER =
    " ON DUPLICATE KEY UPDATE permission=VALUES(permission), username=VALUES(username)"
  private val SQL_SELECT_USER_PERM = "SELECT permission FROM caas.user_permissions WHERE username=?"
  private val SQL_USER_PER_FIELD = " ,(?, ?)"
  private val SQL_USER_PER_NUMFIELD = 2
  private val SELECT_USER_ROLE_SQL =
    "SELECT * FROM caas.user_roles WHERE username=? AND role_id=? AND organization_id=?"
  private val SQL_INSERT_USER_ROLE =
    "INSERT INTO caas.user_roles (username,organization_id, role_id, expired_time) VALUES (?, ?, ?, ?)"
  private val UPDATE_ON_DUPLICATE_USER_ROLE =
    " ON DUPLICATE KEY UPDATE role_id=VALUES(role_id), username=VALUES(username), expired_time=VALUES(expired_time)"
  private val SQL_USER_ROLE_FIELD = " ,(?, ?, ?)"
  private val SQL_USER_ROLE_NUMFIELD = 3
  private val SQL_DELETE_USER_ROLE_LIST =
    "DELETE FROM caas.user_roles WHERE (username, organization_id, role_id) IN ( (?, ?, ?))"

  private val SQL_SELECT_ROLE_BY_USER =
    """
      |SELECT role_result.role_id, role_result.role_name, role_result.permission, user_roles.expired_time
      |FROM caas.user_roles JOIN (
      | SELECT role.role_id, role.role_name, role_permissions.permission
      | FROM caas.role LEFT JOIN caas.role_permissions ON caas.role.role_id=role_permissions.role_id
      | WHERE role.organization_id=?
      |) AS role_result ON user_roles.role_id=role_result.role_id
      |WHERE user_roles.username=?
      |""".stripMargin
  private val SELECT_ALL_ROLES_BY_ORG_USER_SQL =
    """
      |SELECT *
      |FROM caas.role, caas.user_roles
      |WHERE role.role_id = user_roles.role_id AND role.organization_id=? AND user_roles.username=?
      |""".stripMargin

  private val SELECT_ALL_ROLE_NAMES_BY_ORG_USER_SQL =
    """
      |SELECT role.role_name
      |FROM caas.user_roles JOIN caas.role ON user_roles.role_id=role.role_id
      |WHERE role.organization_id=? AND user_roles.username=?
      |""".stripMargin

  private val SQL_SELECT_PERMISSION_FROM_ROLE_PERM_BY_USER =
    """
      |SELECT role_result.role_id, role_result.role_name, role_result.permission, user_roles.expired_time
      |FROM caas.user_roles
      |JOIN (
      |	SELECT role.role_id, role.role_name, role_permissions.permission
      |	FROM caas.role LEFT JOIN caas.role_permissions ON role.role_id=role_permissions.role_id
      | WHERE role.organization_id=?
      |) AS role_result ON user_roles.role_id=role_result.role_id
      |WHERE user_roles.username=?
      |""".stripMargin
  private val SQL_SELECT_PERMISSION_FROM_USER_PERM_BY_USER =
    "SELECT permission FROM caas.user_permissions WHERE organization_id=? AND username=?"
  private val DELETE_USER_PERMS_SQL =
    "DELETE FROM caas.user_permissions WHERE (organization_id, username, permission) IN ( (?, ?, ?))"
  private val SQL_COUNT_USER_WITH_PERM =
    "SELECT COUNT(DISTINCT username) FROM caas.user_permissions WHERE organization_id=? AND permission=?"
}

case class MySqlUserRepository(client: JdbcClient) extends UserRepository {

  import MySqlUserRepository._

  override def deleteUser(organizationId: Long, username: String): Unit = {
    client.executeUpdate(
      SQL_DELETE_USER,
      username,
      organizationId
    )
  }

  override def insertUser(
      organizationId: Long,
      username: String,
      passwordHashed: String,
      isActive: Boolean,
      createTime: Long,
      userType: Option[UserType] = None
  ): User = {
    val count = client.executeUpdate(
      SQL_INSER_USER,
      username,
      passwordHashed,
      isActive,
      createTime,
      organizationId,
      userType.getOrElse(UserType.User).toString
    )

    if (count <= 0)
      throw new SQLException("No user was added.")
    User(username, passwordHashed, true, createTime)
  }

  override def insertUser(organizationId: Long, username: String, passwordHash: String): User = {
    val createTime = System.currentTimeMillis
    insertUser(organizationId, username, passwordHash, true, createTime)
  }

  override def insertUserPermission(organizationId: Long, username: String, permission: String): Boolean = {
    val count = client.executeUpdate(
      SQL_INSERT_USER_PERM + ON_UPDATE_DUPLICATE_USER_PER,
      organizationId,
      username,
      permission
    )

    count > 0
  }

  override def insertUserPermissions(organizationId: Long, username: String, permissions: Set[String]): Boolean = {
    if (permissions == null || permissions.isEmpty) {
      true
    } else {
      val records = permissions.map(Array(organizationId, username, _)).toArray
      val count = client.executeBatchUpdate(SQL_INSERT_USER_PERM + ON_UPDATE_DUPLICATE_USER_PER, records)

      count > 0
    }
  }

  override def getUserRole(organizationId: Long, username: String, roleId: Int): Option[RoleInfo] = {
    client.executeQuery(SELECT_USER_ROLE_SQL, username, roleId, organizationId)(readRoleInfos).headOption
  }

  override def addRole(organizationId: Long, username: String, roleId: Int, expireTime: Long): Boolean = {
    val count = client.executeUpdate(
      SQL_INSERT_USER_ROLE + UPDATE_ON_DUPLICATE_USER_ROLE,
      username,
      organizationId,
      roleId,
      expireTime
    )

    count > 0
  }

  override def addRoles(organizationId: Long, username: String, roleIds: Map[Int, Long]): Boolean = {
    roleIds.nonEmpty match {
      case true =>
        val records = roleIds.map {
          case (roleId, expiredTime) => Array(username, organizationId, roleId, expiredTime)
        }.toArray
        val count = client.executeBatchUpdate(SQL_INSERT_USER_ROLE + UPDATE_ON_DUPLICATE_USER_ROLE, records)

        count > 0
      case false => true
    }
  }

  override def isActiveUser(organizationId: Long, username: String, password: String): Boolean = {
    client.executeQuery(SQL_SELECT_USER_PASS, username, password, organizationId)(rs => {
      if (rs.next())
        rs.getBoolean("is_active")
      else
        throw new Exception("Credentials are incorrect.")
    })
  }

  override def isActiveUsername(organizationId: Long, username: String): Boolean = {
    client.executeQuery(SQL_SELECT_USER_ACTIVE_STATUS, username, organizationId)(rs => {
      if (rs.next())
        rs.getBoolean("is_active")
      else
        false
    })
  }

  override def getAllPermissions(organizationId: Long, username: String): Seq[String] = {

    val rolePerms =
      client.executeQuery(SQL_SELECT_PERMISSION_FROM_ROLE_PERM_BY_USER, organizationId, username)(readPermissions)
    val userPerms =
      client.executeQuery(SQL_SELECT_PERMISSION_FROM_USER_PERM_BY_USER, organizationId, username)(readPermissions)

    val permissions = mutable.HashSet.empty[String]
    rolePerms.foreach(permissions.add(_))
    userPerms.foreach(permissions.add(_))
    permissions.toSeq
  }

  override def getUserPermissions(organizationId: Long, username: String): Future[Seq[String]] = {
    Future {
      syncGetUserPermissions(organizationId, username)
    }
  }

  override def syncGetUserPermissions(organizationId: Long, username: String): Seq[String] = {
    client.executeQuery(
      SQL_SELECT_PERMISSION_FROM_USER_PERM_BY_USER,
      organizationId,
      username
    )(readPermissions)
  }

  private def readPermissions(rs: ResultSet): Seq[String] = {
    val permissions = ListBuffer.empty[String]
    while (rs.next()) {
      permissions.append(rs.getString("permission"))
    }
    permissions
  }

  override def isExistUser(organizationId: Long, username: String): Boolean = {
    client.executeQuery(SQL_SELECT_USER, username, organizationId)(rs => {
      if (rs.next()) true else false
    })
  }

  private def readUsernames(rs: ResultSet): Seq[String] = {
    val permissions = ListBuffer.empty[String]
    while (rs.next()) {
      permissions.append(rs.getString("username"))
    }
    permissions
  }

  override def getAllUsername(organizationId: Long, userType: Option[UserType] = None): Seq[String] = {
    client.executeQuery(SQL_SELECT_ALL_USER, organizationId, userType.getOrElse(UserType.User).toString)(readUsernames)
  }

  override def listUserIds(
      organizationId: Long,
      isActive: Option[Boolean],
      from: Int,
      size: Int,
      userType: Option[UserType] = None
  ): Page[String] = {
    val statusQuery = if (isActive.isDefined) "is_active=?" else "?"
    val total = client.executeQuery(
      s"SELECT COUNT(username) FROM caas.user WHERE $statusQuery AND user_type=? AND organization_id=?",
      isActive.map(x => if (x) 1 else 0).getOrElse(1),
      userType.getOrElse(UserType.User).toString,
      organizationId
    )(readTotalCount)

    val usernames = client.executeQuery(
      s"SELECT username FROM caas.user WHERE $statusQuery AND user_type = ? AND organization_id=? ORDER BY created_time DESC LIMIT ?,?",
      isActive.map(x => if (x) 1 else 0).getOrElse(1),
      userType.getOrElse(UserType.User).toString,
      organizationId,
      from,
      size
    )(readUsernames)

    Page[String](total, usernames)

  }

  private def readTotalCount(rs: ResultSet): Int = {
    if (rs.next())
      rs.getInt(1)
    else 0
  }

  override def getUserInfo(organizationId: Long, username: String): Future[User] = {
    Future {
      syncGetUserInfo(organizationId, username)
    }

  }

  override def syncGetUserInfo(organizationId: Long, username: String): User = {
    val userInfo = client.executeQuery(SQL_SELECT_USER, username, organizationId)(readUserInfo)
    val roles = client.executeQuery(SQL_SELECT_ROLE_BY_USER, 0, username)(readUserRoles)
    val permissions = syncGetUserPermissions(organizationId, username)
    userInfo.copy(
      permissions = permissions.toSet,
      roles = roles.toArray
    )

  }

  private def readUserRoles(rs: ResultSet): Seq[RoleInfo] = {
    val roles = mutable.Map.empty[Int, RoleInfo]

    while (rs.next()) {
      val roleId = rs.getInt("role_id")
      val name = rs.getString("role_name")
      val expiredTime = rs.getLong("expired_time")
      val permission = rs.getString("permission")

      val role = roles.getOrElse(roleId, RoleInfo(roleId, name, expiredTime))
      roles.put(
        roleId,
        role.copy(
          permissions = role.permissions ++ Set(permission).filterNot(_ == null)
        )
      )
    }
    roles.values.toSeq
  }

  override def getAllRoleNames(organizationId: Long, username: String): Seq[String] = {
    client.executeQuery(SELECT_ALL_ROLE_NAMES_BY_ORG_USER_SQL, organizationId, username)(readRoleNames)
  }

  override def getAssignedRoles(organizationId: Long, username: String): Future[Seq[RoleInfo]] = {
    Future {
      client.executeQuery(SELECT_ALL_ROLES_BY_ORG_USER_SQL, organizationId, username)(readRoleInfos)
    }
  }

  override def syncGetActiveRoles(organizationId: Long, username: String): Seq[RoleInfo] = {
    client.executeQuery(SELECT_ALL_ROLES_BY_ORG_USER_SQL, organizationId, username)(readRoleInfos)
  }

  override def getActiveAssignedRoleIds(organizationId: Long, username: String): Future[Seq[Int]] = {
    getAssignedRoles(organizationId, username).map(_.filterNot(_.isExpired).map(_.id))
  }

  private def readRoleNames(rs: ResultSet): Seq[String] = {
    val names = ListBuffer.empty[String]
    while (rs.next()) {
      names.append(rs.getString("role_name"))
    }
    names
  }

  override def countAllUserInfo(organizationId: Long, userType: Option[UserType] = None): Int = {
    client.executeQuery(SQL_COUNT_ALL_USER_INFO, organizationId, userType.getOrElse(UserType.User).toString)(
      readTotalCount
    )
  }

  override def getAllUserWithRoleInfo(
      organizationId: Long,
      isActive: Option[Boolean],
      from: Int,
      size: Int,
      userType: Option[UserType] = None
  ): Page[User] = {

    val statusQuery =
      s" WHERE ${if (isActive.isDefined) "is_active=? AND organization_id=? AND user_type=?"
      else "? AND organization_id=? AND user_type=?"}"

    val total = client.executeQuery(
      s"SELECT COUNT(username) FROM caas.user $statusQuery",
      isActive.map(x => if (x) 1 else 0).getOrElse(1),
      organizationId,
      userType.getOrElse(UserType.User).toString
    )(readTotalCount)

    val users = client.executeQuery(
      s"${String.format(SQL_SELECT_ALL_USER_INFO, statusQuery)} LIMIT ?,?",
      isActive.map(x => if (x) 1 else 0).getOrElse(1),
      organizationId,
      userType.getOrElse(UserType.User).toString,
      from,
      size
    )(readUserWithRoles)

    Page[User](total, users)
  }

  override def searchUserRoleInfo(
      organizationId: Long,
      searchUsername: String,
      from: Int,
      size: Int,
      userType: Option[UserType] = None
  ): Seq[User] = {
    client.executeQuery(
      String.format(SQL_SEARCH_ALL_USER_INFO, " LIMIT ?,?"),
      userType.getOrElse(UserType.User).toString,
      "%" + searchUsername + "%",
      organizationId,
      from,
      size
    )(readUserWithRoles)
  }

  override def countUserRoleInfo(
      organizationId: Long,
      searchUsername: String,
      userType: Option[UserType] = None
  ): Int = {
    client.executeQuery(
      SQL_COUNT_SEARCH_ALL_USER_INFO,
      s"%$searchUsername%",
      organizationId,
      userType.getOrElse(UserType.User).toString
    )(readTotalCount)
  }

  private def readUserInfo(rs: ResultSet): User = {
    if (rs.next()) {
      User(
        rs.getString("username"),
        rs.getString("password"),
        rs.getBoolean("is_active"),
        rs.getLong("created_time")
      )
    } else
      throw new SQLException("No user was found.")
  }

  private def readRoleInfos(rs: ResultSet): Seq[RoleInfo] = {
    val roles = ListBuffer.empty[RoleInfo]
    while (rs.next()) {
      val roleInfo = RoleInfo(
        rs.getInt("role_id"),
        rs.getString("role_name"),
        rs.getLong("expired_time")
      )
      roles.append(roleInfo)
    }
    roles
  }

  private def readUserWithRoles(rs: ResultSet): Seq[User] = {
    val userInfos = ListBuffer.empty[User]
    val userIndexMap = mutable.Map.empty[String, Int]

    while (rs.next()) {
      val username = rs.getString("username")
      val role = if (rs.getObject("role_id") != null) {
        RoleInfo(
          rs.getInt("role_id"),
          rs.getString("role_name"),
          rs.getLong("expired_time")
        )
      } else null

      if (userIndexMap.contains(username)) {
        val index = userIndexMap.get(username).get
        val userInfo = userInfos(index)
        userInfos.update(
          index,
          userInfo.copy(
            roles = userInfo.roles ++ Seq(role).filterNot(_ == null)
          )
        )
      } else {
        val index = userInfos.size
        val userInfo = User(
          username,
          "",
          rs.getBoolean("is_active"),
          rs.getLong("created_time")
        )
        userInfos.append(
          userInfo.copy(
            roles = userInfo.roles ++ Seq(role).filterNot(_ == null)
          )
        )
        userIndexMap.put(username, index)

      }

    }

    userInfos.toSeq

  }

  override def getListUserRoleInfoWithHighestRoleFilter(
      organizationId: Long,
      notInRoleIds: Seq[Int],
      inRoleIds: Seq[Int],
      from: Int,
      size: Int,
      userType: Option[UserType] = None
  ): Page[User] = {
    val total = countUserRoleInfoWithHighestRoleFilter(organizationId, notInRoleIds, inRoleIds, userType)
    val users = client.executeQuery(
      String.format(
        SQL_SELECT_ALL_USER_INFO_WITH_HIGHEST_ROLE_FILTER,
        buildWhereQuery(organizationId, notInRoleIds, inRoleIds),
        " LIMIT ?,?"
      ),
      userType.getOrElse(UserType.User).toString,
      from,
      size
    )(readUserWithRoles)

    Page[User](total, users)
  }

  private def countUserRoleInfoWithHighestRoleFilter(
      organizationId: Long,
      notInRoleIds: Seq[Int],
      inRoleIds: Seq[Int],
      userType: Option[UserType] = None
  ): Int = {

    client.executeQuery(
      String.format(
        SQL_COUNT_ALL_USER_INFO_WITH_HIGHEST_ROLE_FILTER,
        buildWhereQuery(organizationId, notInRoleIds, inRoleIds)
      ),
      userType.getOrElse(UserType.User).toString
    )(readTotalCount)
  }

  private def buildWhereQuery(organizationId: Long, notInRoleIds: Seq[Int], inRoleIds: Seq[Int]): String = {
    var query: String = null
    if (notInRoleIds != null && notInRoleIds.isEmpty == false)
      query = String.format(SQL_NOT_IN_ROLE, organizationId.toString, notInRoleIds.mkString(","))
    if (inRoleIds != null && inRoleIds.isEmpty == false) {
      query =
        if (query != null)
          query + " AND " + String.format(SQL_IN_ROLE, organizationId.toString, inRoleIds.mkString(","))
        else
          String.format(SQL_IN_ROLE, organizationId.toString, inRoleIds.mkString(","))
    }

    if (query == null)
      " WHERE user_type=? "
    else
      " WHERE user_type=? " + query
  }

  private def buildSearchQuery(organizationId: Long, notInRoleIds: Seq[Int], inRoleIds: Seq[Int]): String = {
    var query: String = null
    if (notInRoleIds != null && notInRoleIds.isEmpty == false)
      query = String.format(SQL_NOT_IN_ROLE, organizationId.toString, notInRoleIds.mkString(","))
    if (inRoleIds != null && inRoleIds.isEmpty == false) {
      query =
        if (query != null)
          query + " AND " + String.format(SQL_IN_ROLE, organizationId.toString, inRoleIds.mkString(","))
        else
          String.format(SQL_IN_ROLE, organizationId.toString, inRoleIds.mkString(","))
    }

    if (query == null)
      ""
    else
      " AND " + query
  }

  override def searchUserRoleInfoWithHighestRoleFilter(
      searchUsername: String,
      organizationId: Long,
      notInRoleIds: Seq[Int],
      inRoleIds: Seq[Int],
      from: Int,
      size: Int,
      userType: Option[UserType] = None
  ): Page[User] = {
    val total = countUserRoleInfoWithHighestRoleFilter(searchUsername, organizationId, notInRoleIds, inRoleIds)
    val users = client.executeQuery(
      String.format(
        SQL_SEARCH_ALL_USER_INFO_WITH_HIGHEST_ROLE_FILTER,
        buildSearchQuery(organizationId, notInRoleIds, inRoleIds),
        " LIMIT ?,?"
      ),
      userType.getOrElse(UserType.User).toString,
      "%" + searchUsername + "%",
      from,
      size
    )(readUserWithRoles)

    Page[User](total, users)

  }

  private def countUserRoleInfoWithHighestRoleFilter(
      searchUsername: String,
      organizationId: Long,
      notInRoleIds: Seq[Int],
      inRoleIds: Seq[Int]
  ): Int = {
    client.executeQuery(
      String.format(
        SQL_COUNT_SEARCH_ALL_USER_INFO_WITH_HIGHEST_ROLE_FILTER,
        buildSearchQuery(organizationId, notInRoleIds, inRoleIds)
      ),
      "%" + searchUsername + "%"
    )(readTotalCount)
  }

  override def isPasswordCorrect(organizationId: Long, username: String, password: String): Boolean = {
    client.executeQuery(
      SQL_IS_PASSWORD,
      username,
      password,
      organizationId
    )(_.next())
  }

  override def setPassword(organizationId: Long, username: String, password: String): Boolean = {
    client.executeUpdate(SQL_SET_USER_PASS, password, username, organizationId) > 0
  }

  override def changeUserActiveStatus(organizationId: Long, username: String, isActive: Boolean): Boolean = {
    client.executeUpdate(SQL_UPDATE_ACTIVE_STATUS, isActive, username, organizationId) > 0
  }

  override def replaceUserPermission(
      organizationId: Long,
      username: String,
      oldPermissions: Seq[String],
      newPermissions: Seq[String]
  ): Unit = {

    def replacePermissions(organizationId: Long, oldPermissions: Set[String], newPermissions: Set[String]): Unit = {
      deleteUserPermissions(organizationId, username, oldPermissions)
      insertOrUpdateUserPermissions(username, newPermissions)
    }

    if (oldPermissions == null || oldPermissions.isEmpty) {
      insertUserPermissions(organizationId, username, newPermissions.toSet)
    } else if (newPermissions == null || newPermissions.isEmpty) {
      deleteUserPermissions(organizationId, username, oldPermissions.toSet)
    } else {
      replacePermissions(organizationId, oldPermissions.toSet, newPermissions.toSet)
    }

  }

  private def insertOrUpdateUserPermissions(username: String, permissions: Set[String]): Unit = {
    val records = permissions.map(perm => Array[Any](perm, username)).toArray
    val insertedCount = client.executeBatchUpdate(SQL_INSERT_USER_PERM + " " + ON_UPDATE_DUPLICATE_USER_PER, records)
    if (insertedCount == 0) {
      throw new SQLException("No perms were added.")
    }
  }

  override def deleteUserPermission(organizationId: Long, username: String, permission: String): Unit = {
    deleteUserPermissions(organizationId, username, Set(permission))
  }

  override def deleteUserPermissions(organizationId: Long, username: String, permissions: Set[String]): Boolean = {
    if (permissions == null || permissions.isEmpty) {
      true
    } else {
      val records = permissions.map(permission => Array(organizationId, username, permission)).toArray
      client.executeBatchUpdate(DELETE_USER_PERMS_SQL, records) > 0
    }
  }

  def replaceUserRole(
      organizationId: Long,
      username: String,
      oldRoleIds: Set[Int],
      newRoleIds: Map[Int, Long]
  ): Unit = {

    def replaceUserRoles(oldRoleIds: Set[Int], newRoleIds: Map[Int, Long]): Unit = {
      removeUserRoles(organizationId, username, oldRoleIds)
      addRoles(organizationId, username, newRoleIds)
    }

    if (oldRoleIds == null || oldRoleIds.isEmpty) {
      addRoles(organizationId, username, newRoleIds)
    } else if (newRoleIds == null || newRoleIds.isEmpty) {
      removeUserRoles(organizationId, username, oldRoleIds)
    } else {
      replaceUserRoles(oldRoleIds, newRoleIds)
    }
  }

  override def removeUserRole(organizationId: Long, username: String, roleId: Int) = {
    removeUserRoles(organizationId, username, Set(roleId))
  }

  override def removeUserRoles(organizationId: Long, username: String, roleIds: Set[Int]): Unit = {
    val records = roleIds.map(roleId => Array(username, organizationId, roleId)).toArray
    client.executeBatchUpdate(SQL_DELETE_USER_ROLE_LIST, records)
  }

  override def getListUserByUsernames(organizationId: Long, usernames: Seq[String]): Seq[User] = {
    val whereConditions: String =
      s"WHERE organization_id = ? AND username IN (${Seq.fill(usernames.length)("?").mkString(", ")})"
    val args: Seq[Any] = Seq(organizationId) ++ usernames
    val querySelectUser: String = String.format(SQL_SELECT_ALL_USER_INFO, whereConditions)
    val users: Seq[User] = client.executeQuery(querySelectUser, args: _*)(readUserWithRoles)
    users
  }

  override def countUsersWithPermission(organizationId: Long, permission: String): Int = {
    client.executeQuery(SQL_COUNT_USER_WITH_PERM, organizationId, permission)(rs => {
      if (rs.next()) {
        rs.getInt(1)
      } else 0
    })
  }
}
