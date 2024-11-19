package co.datainsider.caas.user_caas.repository

import co.datainsider.bi.client.JdbcClient
import com.twitter.inject.Logging
import co.datainsider.caas.user_profile.domain.user.RoleInfo

import java.sql.{ResultSet, SQLException}
import scala.collection.mutable.ListBuffer

object MySqlRoleRepository {
  final private val SQL_INSERT_ROLE = "INSERT INTO caas.role (organization_id, role_id, role_name) VALUES (?, ?, ?)"
  final private val SQL_UPDATE_ROLE = "UPDATE caas.role SET role_name=? WHERE organization_id=? AND role_id=?"
  final private val SQL_ROLE_FIELD = ",(?, ?) "
  final private val SQL_DELETE_ROLE = "DELETE FROM caas.role WHERE organization_id=? AND role_id=?"
  final private val SQL_SELECT_ROLE =
    "SELECT organization_id, role_id, role_name FROM caas.role WHERE organization_id=? AND role_id=?"
  final private val SQL_SELECT_ALL_ROLE =
    "SELECT organization_id, role_id, role_name FROM caas.role WHERE organization_id=?"
  final private val SQL_INSERT_ROLE_PERM =
    "INSERT INTO caas.role_permissions (organization_id, role_id, permission) VALUES (?, ?, ?)"
  final private val ON_DUPLICATE_ROLE_PERM =
    " ON DUPLICATE KEY UPDATE organization_id=VALUES(organization_id), role_id=VALUES(role_id), permission=VALUES(permission) "
  final private val SQL_ROLE_PERM_FIELD = ",(?, ?)"
  final private val SQL_ROLE_PERM_NUMFIELD = 2
  final private val SQL_DELETE_ROLE_PERM_LIST =
    "DELETE FROM caas.role_permissions WHERE (organization_id, role_id, permission) IN ((?, ?, ?))"
  final private val SQL_SELECT_ROLE_PERM_SET =
    "SELECT role_id, permission FROM caas.role_permissions WHERE organization_id=? AND role_id=?"
  final private val SELECT_ROLE_PERMS_BY_NAME_SQL =
    """
      |SELECT permission
      |FROM caas.role_permissions, caas.role
      |WHERE role.organization_id=? AND caas.role_permissions.role_id = role.role_id AND role.role_name=?
      |""".stripMargin

  final private val SELECT_ROLE_PERMS_BY_ROLE_IDS_SQL =
    """
      |SELECT permission
      |FROM caas.role_permissions, caas.role
      |WHERE role.organization_id=? AND caas.role_permissions.role_id = role.role_id AND role.role_id IN (%s)
      |""".stripMargin
}

case class MySqlRoleRepository(client: JdbcClient) extends RoleRepository {

  import MySqlRoleRepository._

  override def insertRole(organizationId: Long, roleId: Int, roleName: String): Unit = {
    val insertedCount = insertRoles(organizationId, Seq(roleId), Seq(roleName))
    if (insertedCount == 0) {
      throw new SQLException("Not register role.")
    }
  }

  def insertRoleMap(organizationId: Long, roleIdMap: Map[Int, String]): Int = {
    val (roleIds, roleNames) =
      roleIdMap.foldLeft((ListBuffer.empty[Int], ListBuffer.empty[String]))((result, entry) => {
        result._1.append(entry._1)
        result._2.append(entry._2)
        result
      })
    val insertedCount = insertRoles(organizationId, roleIds, roleNames)
    if (insertedCount == 0) {
      throw new SQLException("No roles were added.")
    }
    insertedCount
  }

  private def insertRoles(organizationId: Long, roleIds: Seq[Int], roleNames: Seq[String]): Int = {

    val records = roleIds
      .zip(roleNames)
      .map {
        case (id, name) => Array(organizationId, id, name)
      }
      .toArray
    client.executeBatchUpdate(SQL_INSERT_ROLE, records)
  }

  override def updateRoleName(organizationId: Long, roleId: Int, newRoleName: String): Unit = {
    client.executeUpdate(SQL_UPDATE_ROLE, newRoleName, organizationId, roleId)
  }

  override def insertRoleWithPermission(
      organizationId: Long,
      roleId: Int,
      roleName: String,
      permissions: Set[String]
  ): Unit = {

    if (client.executeUpdate(SQL_INSERT_ROLE, organizationId, roleId, roleName) == 0)
      throw new SQLException("No roles were added.")
    insertOrUpdateRolePermissions(organizationId, roleId, permissions)

  }

  override def addRolePermission(organizationId: Long, roleId: Int, permission: String): Unit = {
    if (permission == null) return

    val insertedCount = client.executeUpdate(
      SQL_INSERT_ROLE_PERM + ON_DUPLICATE_ROLE_PERM,
      organizationId,
      roleId,
      permission
    )
    if (insertedCount == 0) {
      throw new SQLException("No roles were added.")
    }
  }

  override def addRolePermission(organizationId: Long, roleId: Int, permissions: Set[String]): Unit = {
    if (permissions == null || permissions.isEmpty) return
    val records = permissions.map(perm => Array(organizationId, roleId, perm)).toArray
    val insertedCount = client.executeBatchUpdate(SQL_INSERT_ROLE_PERM + " " + ON_DUPLICATE_ROLE_PERM, records)
    if (insertedCount == 0) {
      throw new SQLException("No perms were added.")
    }
  }

  override def getAllRole(organizationId: Long): Seq[RoleInfo] = {
    client.executeQuery(SQL_SELECT_ALL_ROLE, organizationId)(readRoleInfos)
  }

  /**
    * Todo: Merge into 1 query
    *
    * @param organizationId
    * @param roleId
    * @return
    */
  override def getRoleInfo(organizationId: Long, roleId: Int): Option[RoleInfo] = {
    val role = client.executeQuery(SQL_SELECT_ROLE, organizationId, roleId)(readRoleInfos).headOption
    val permissions = client.executeQuery(SQL_SELECT_ROLE_PERM_SET, organizationId, roleId)(readPermissions)

    role.map(
      _.copy(
        permissions = permissions
      )
    )

  }

  /**
    * TODO: Merge into 1 query
    *
    * @param organizationId
    * @return
    */
  override def getAllRoleWithPermissions(organizationId: Long): Seq[RoleInfo] = {
    val roles = client.executeQuery(SQL_SELECT_ALL_ROLE, organizationId)(readRoleInfos)

    roles.map(role => {
      val permissions = client.executeQuery(SQL_SELECT_ROLE_PERM_SET, organizationId, role.id)(readPermissions)

      role.copy(permissions = permissions)
    })
  }

  override def getRolePermissionByName(organizationId: Long, roleName: String): Set[String] = {
    client.executeQuery(
      SELECT_ROLE_PERMS_BY_NAME_SQL,
      organizationId,
      roleName
    )(readPermissions)
  }

  override def getRolePermissionByRoleIds(organizationId: Long, roleIds: Seq[Int]): Set[String] = {
    if (roleIds == null || roleIds.isEmpty) {
      Set.empty[String]
    } else {
      val query = String.format(SELECT_ROLE_PERMS_BY_ROLE_IDS_SQL, roleIds.map(_ => "?").mkString(","))
      val params = ListBuffer.empty[Any]
      params.append(organizationId)
      params.append(roleIds: _*)
      client.executeQuery(
        query,
        params: _*
      )(readPermissions)
    }
  }

  override def deleteRole(organizationId: Long, roleId: Int): Unit = {
    client.executeUpdate(SQL_DELETE_ROLE, organizationId, roleId)
  }

  override def deleteRolePermission(organizationId: Long, roleId: Int, permission: String): Unit = {
    if (permission == null) return
    client.executeUpdate(SQL_DELETE_ROLE_PERM_LIST, organizationId, roleId, permission)
  }

  override def deleteRolePermission(organizationId: Long, roleId: Int, permissions: Set[String]): Unit = {
    if (permissions == null || permissions.isEmpty) return
    val records = permissions.map(permission => Array(organizationId, roleId, permission)).toArray
    client.executeBatchUpdate(SQL_DELETE_ROLE_PERM_LIST, records)
  }

  override def replaceRolePermission(
      organizationId: Long,
      roleId: Int,
      oldPermissions: Set[String],
      newPermissions: Set[String]
  ): Unit = {
    def replacePermissions(organizationId: Long, oldPermissions: Set[String], newPermissions: Set[String]): Unit = {

      deleteRolePermission(organizationId, roleId, oldPermissions)
      insertOrUpdateRolePermissions(organizationId, roleId, newPermissions)
    }

    if (oldPermissions == null || oldPermissions.isEmpty) {
      addRolePermission(organizationId, roleId, newPermissions)
    } else if (newPermissions == null || newPermissions.isEmpty) {
      deleteRolePermission(organizationId, roleId, oldPermissions)
    } else {
      replacePermissions(organizationId, oldPermissions, newPermissions)
    }
  }

  private def insertOrUpdateRolePermissions(organizationId: Long, roleId: Int, permissions: Set[String]): Unit = {
    val records = permissions.map(perm => Array(organizationId, roleId, perm)).toArray
    val insertedCount = client.executeBatchUpdate(SQL_INSERT_ROLE_PERM + " " + ON_DUPLICATE_ROLE_PERM, records)
    if (insertedCount == 0) {
      throw new SQLException("No perms were added.")
    }
  }

  private def readRoleInfos(rs: ResultSet): Seq[RoleInfo] = {
    val roles = ListBuffer.empty[RoleInfo]
    while (rs.next()) {
      val roleInfo = RoleInfo(
        rs.getInt("role_id"),
        rs.getString("role_name")
      )
      roles.append(roleInfo)
    }
    roles
  }

  private def readPermissions(rs: ResultSet): Set[String] = {
    val permissions = ListBuffer.empty[String]
    while (rs.next()) {
      permissions.append(rs.getString("permission"))
    }
    permissions.toSet
  }

}
