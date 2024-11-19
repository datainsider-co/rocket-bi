package co.datainsider.common.authorization.domain

abstract class AbstractSettingPermissionProvider[B <: AbstractSettingPermissionProvider[B]]
    extends PermissionBuilder
    with CURDPermissionProvider {

  protected var id: Option[String] = None

  protected var organizationId: Long

  final def withOrganizationId(organizationId: Long): AbstractSettingPermissionProvider[B] = {
    this.organizationId = organizationId
    this
  }

  final def withDirectoryId(id: String): AbstractSettingPermissionProvider[B] = {
    this.id = Option(id)
    this
  }
}

case class SettingPermissionProvider() extends AbstractSettingPermissionProvider[SettingPermissionProvider] {
  override def all(): String = buildPerm(organizationId,"setting", "*", id.getOrElse("*"))

  override def view(): String = buildPerm(organizationId,"setting", "view", id.getOrElse("*"))

  override def create(): String = buildPerm(organizationId,"setting", "create", id.getOrElse("*"))

  override def edit(): String = buildPerm(organizationId,"setting", "edit", id.getOrElse("*"))

  override def delete(): String = buildPerm(organizationId,"setting", "delete", id.getOrElse("*"))

  override def allPermissions(organizationId: Long): Set[String] = {
    Set(
      view(),
      create(),
      edit(),
      delete()
    )
  }

  override protected var organizationId: Long = _
}
