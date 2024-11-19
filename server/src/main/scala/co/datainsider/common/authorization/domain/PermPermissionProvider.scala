package co.datainsider.common.authorization.domain

abstract class AbstractPermPermissionProvider[B <: AbstractPermPermissionProvider[B]]
    extends PermissionBuilder
    with CURDPermissionProvider {

  protected var id: Option[String] = None

  protected var organizationId: Long

  final def withOrganizationId(organizationId: Long): AbstractPermPermissionProvider[B] = {
    this.organizationId = organizationId
    this
  }

  final def withDirectoryId(id: String): AbstractPermPermissionProvider[B] = {
    this.id = Option(id)
    this
  }
}

case class PermPermissionProvider() extends AbstractPermPermissionProvider[PermPermissionProvider] {

  override def all(): String = buildPerm(organizationId,"permission", "*", id.getOrElse("*"))

  override def view(): String = buildPerm(organizationId,"permission", "view", id.getOrElse("*"))

  override def create(): String = buildPerm(organizationId,"permission", "create", id.getOrElse("*"))

  override def edit(): String = buildPerm(organizationId,"permission", "edit", id.getOrElse("*"))

  override def delete(): String = buildPerm(organizationId,"permission", "delete", id.getOrElse("*"))

  def assign(): String = buildPerm(organizationId,"permission", "assign", id.getOrElse("*"))

  override def allPermissions(organizationId: Long): Set[String] = {
    Set(
      view(),
      create(),
      edit(),
      delete(),
      assign()
    )
  }

  override protected var organizationId: Long = _
}
