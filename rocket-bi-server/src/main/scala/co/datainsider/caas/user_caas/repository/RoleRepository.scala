package co.datainsider.caas.user_caas.repository

import co.datainsider.caas.user_profile.domain.user.RoleInfo

/**
  * @author andy
  * @since 8/4/20
  */
trait RoleRepository {

  def insertRole(organizationId: Long, roleId: Int, roleName: String): Unit

  def insertRoleMap(organizationId: Long, roleIds: Map[Int, String]): Int

  def insertRoleWithPermission(organizationId: Long, roleId: Int, roleName: String, permissions: Set[String]): Unit

  def addRolePermission(organizationId: Long, roleId: Int, permission: String): Unit

  def addRolePermission(organizationId: Long, roleId: Int, permissions: Set[String]): Unit

  def getRoleInfo(organizationId: Long, roleId: Int): Option[RoleInfo]

  def getAllRole(organizationId: Long): Seq[RoleInfo]

  def getAllRoleWithPermissions(organizationId: Long): Seq[RoleInfo]

  def getRolePermissionByName(organizationId: Long, roleName: String): Set[String]

  def getRolePermissionByRoleIds(organizationId: Long, roleIds: Seq[Int]): Set[String]

  def deleteRole(organizationId: Long, roleId: Int): Unit

  def deleteRolePermission(organizationId: Long, roleId: Int, permission: String): Unit

  def deleteRolePermission(organizationId: Long, roleId: Int, permissions: Set[String]): Unit

  def updateRoleName(organizationId: Long, roleId: Int, newRoleName: String): Unit

  def replaceRolePermission(
      organizationId: Long,
      roleId: Int,
      oldPermissions: Set[String],
      newPermissions: Set[String]
  ): Unit
}

/**
  * NOOP (No implementation) of RoleRepository
  */
case class NoopRoleRepository() extends RoleRepository {

  override def insertRole(organizationId: Long, roleId: Int, roleName: String): Unit = {}

  override def insertRoleMap(organizationId: Long, roleIds: Map[Int, String]): Int = {
    0
  }

  override def insertRoleWithPermission(
      organizationId: Long,
      roleId: Int,
      roleName: String,
      permissions: Set[String]
  ): Unit = {}

  override def addRolePermission(organizationId: Long, roleId: Int, permission: String): Unit = {}

  override def addRolePermission(organizationId: Long, roleId: Int, permissions: Set[String]): Unit = {}

  override def getRoleInfo(organizationId: Long, roleId: Int): Option[RoleInfo] = None

  override def getAllRole(organizationId: Long): Seq[RoleInfo] = Seq.empty

  override def getAllRoleWithPermissions(organizationId: Long): Seq[RoleInfo] = Seq.empty

  override def getRolePermissionByName(organizationId: Long, roleName: String): Set[String] = Set.empty

  override def getRolePermissionByRoleIds(organizationId: Long, roleIds: Seq[Int]): Set[String] = Set.empty

  override def deleteRole(organizationId: Long, roleId: Int): Unit = {}

  override def deleteRolePermission(organizationId: Long, roleId: Int, permission: String): Unit = {}

  override def deleteRolePermission(organizationId: Long, roleId: Int, permissions: Set[String]): Unit = {}

  override def updateRoleName(organizationId: Long, roleId: Int, newRoleName: String): Unit = {}

  override def replaceRolePermission(
      organizationId: Long,
      roleId: Int,
      oldPermissions: Set[String],
      newPermissions: Set[String]
  ): Unit = {}
}
