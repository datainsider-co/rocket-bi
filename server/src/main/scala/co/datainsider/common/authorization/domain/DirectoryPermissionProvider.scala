package co.datainsider.common.authorization.domain

abstract class AbstractDirectoryPermissionProvider[B <: AbstractDirectoryPermissionProvider[B]]
    extends PermissionBuilder
    with CURDPermissionProvider {

  protected var id: Option[Long] = None

  protected var organizationId: Long

  final def withOrganizationId(organizationId: Long): AbstractDirectoryPermissionProvider[B] = {
    this.organizationId = organizationId
    this
  }

  final def withDirectoryId(id: Long): AbstractDirectoryPermissionProvider[B] = {
    this.id = Option(id)
    this
  }

  def copy(): String
}

case class DirectoryPermissionProvider() extends AbstractDirectoryPermissionProvider[DirectoryPermissionProvider] {

  override def all(): String = buildPerm(organizationId,"directory", "*", id.map(_.toString).getOrElse("*"))

  override def view(): String = buildPerm(organizationId,"directory", "view", id.map(_.toString).getOrElse("*"))

  override def create(): String = buildPerm(organizationId,"directory", "create", id.map(_.toString).getOrElse("*"))

  override def edit(): String = buildPerm(organizationId,"directory", "edit", id.map(_.toString).getOrElse("*"))

  override def delete(): String = buildPerm(organizationId,"directory", "delete", id.map(_.toString).getOrElse("*"))

  def copy(): String = buildPerm(organizationId,"directory", "copy", id.map(_.toString).getOrElse("*"))

  override def allPermissions(organizationId: Long): Set[String] = {
    Set(
      view(),
      create(),
      edit(),
      delete(),
      copy()
    )
  }

  override protected var organizationId: Long = _
}
