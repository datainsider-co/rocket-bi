package co.datainsider.common.authorization.domain

/**
  * @author tvc12 - Thien Vi
  * @created 05/06/2021 - 11:25 PM
  */

abstract class AbstractDatabasePermissionProvider[B <: AbstractDatabasePermissionProvider[B]]
  extends PermissionBuilder
    with CURDPermissionProvider {
  protected var dbName: Option[String] = None

  protected var organizationId: Long

  final def withOrganizationId(organizationId: Long): AbstractDatabasePermissionProvider[B] = {
    this.organizationId = organizationId
    this
  }

  final def withDbName(dbName: String): AbstractDatabasePermissionProvider[B] = {
    this.dbName = Option(dbName)
    this
  }
}

case class DatabasePermissionProvider() extends AbstractDatabasePermissionProvider[DatabasePermissionProvider]{
  override def all(): String = buildPerm(organizationId, "database", "*", dbName.getOrElse("*"))

  override def view(): String = buildPerm(organizationId, "database", "view", dbName.getOrElse("*"))

  override def create(): String = buildPerm(organizationId,"database", "create", dbName.getOrElse("*"))

  override def edit(): String = buildPerm(organizationId,"database", "edit", dbName.getOrElse("*"))

  override def delete(): String = buildPerm(organizationId,"database", "delete", dbName.getOrElse("*"))

  override def allPermissions(organizationId: Long): Set[String] = Set(
    view(),
    create(),
    edit(),
    delete()
  )

  override protected var organizationId: Long = _
}
