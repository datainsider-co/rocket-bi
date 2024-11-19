package co.datainsider.common.authorization.domain

abstract class AbstractDashboardPermissionProvider[B <: AbstractDashboardPermissionProvider[B]]
    extends PermissionBuilder
    with CURDPermissionProvider {

  protected var id: Option[Long] = None

  protected var organizationId: Long

  final def withOrganizationId(organizationId: Long): AbstractDashboardPermissionProvider[B] = {
    this.organizationId = organizationId
    this
  }

  final def withDashboardId(id: Long): AbstractDashboardPermissionProvider[B] = {
    this.id = Option(id)
    this
  }

  def copy(): String

  def share(): String

}

case class DashboardPermissionProvider() extends AbstractDashboardPermissionProvider[DashboardPermissionProvider] {

  override def all(): String = buildPerm(organizationId,"dashboard", "*", id.map(_.toString).getOrElse("*"))

  override def view(): String = buildPerm(organizationId,"dashboard", "view", id.map(_.toString).getOrElse("*"))

  override def create(): String = buildPerm(organizationId,"dashboard", "create", id.map(_.toString).getOrElse("*"))

  override def edit(): String = buildPerm(organizationId,"dashboard", "edit", id.map(_.toString).getOrElse("*"))

  override def delete(): String = buildPerm(organizationId,"dashboard", "delete", id.map(_.toString).getOrElse("*"))

  def copy(): String = buildPerm(organizationId,"dashboard", "copy", id.map(_.toString).getOrElse("*"))

  def share(): String = buildPerm(organizationId,"dashboard", "share", id.map(_.toString).getOrElse("*"))

  override def allPermissions(organizationId: Long): Set[String] = {
    Set(
      view(),
      create(),
      edit(),
      delete(),
      copy(),
      share()
    )
  }

  override protected var organizationId: Long = _
}
