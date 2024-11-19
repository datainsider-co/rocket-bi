package co.datainsider.common.authorization.domain

abstract class AbstractUserPermissionProvider[B <: AbstractUserPermissionProvider[B]]
    extends PermissionBuilder
    with CURDPermissionProvider {

  protected var id: Option[String] = None

  protected var organizationId: Long

  final def withOrganizationId(organizationId: Long): AbstractUserPermissionProvider[B] = {
    this.organizationId = organizationId
    this
  }

  final def withUserId(id: String): AbstractUserPermissionProvider[B] = {
    this.id = Option(id)
    this
  }
}

case class UserPermissionProvider() extends AbstractUserPermissionProvider[UserPermissionProvider] {
  override def all(): String = buildPerm(organizationId,"user", "*", id.getOrElse("*"))

  override def view(): String = buildPerm(organizationId,"user", "view", id.getOrElse("*"))

  override def create(): String = buildPerm(organizationId,"user", "create", id.getOrElse("*"))

  override def edit(): String = buildPerm(organizationId,"user", "edit", id.getOrElse("*"))

  override def delete(): String = buildPerm(organizationId,"user", "delete", id.getOrElse("*"))

  def activate(): String = buildPerm(organizationId,"user", "activate", id.getOrElse("*"))

  def deactivate(): String = buildPerm(organizationId,"user", "deactivate", id.getOrElse("*"))

  override def allPermissions(organizationId: Long): Set[String] = {
    Set(
      view(),
      create(),
      edit(),
      delete(),
      activate(),
      deactivate()
    )
  }

  override protected var organizationId: Long = _
}
