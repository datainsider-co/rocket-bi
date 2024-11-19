package co.datainsider.common.authorization.domain

abstract class AbstractWidgetPermissionProvider[B <: AbstractWidgetPermissionProvider[B]]
    extends PermissionBuilder
    with CURDPermissionProvider {

  protected var id: Option[Long] = None

  protected var organizationId: Long

  final def withOrganizationId(organizationId: Long): AbstractWidgetPermissionProvider[B] = {
    this.organizationId = organizationId
    this
  }

  final def withWidgetId(id: Long): AbstractWidgetPermissionProvider[B] = {
    this.id = Option(id)
    this
  }
}

case class WidgetPermissionProvider() extends AbstractWidgetPermissionProvider[WidgetPermissionProvider] {

  override def all(): String = buildPerm(organizationId,"widget","*", id.map(_.toString).getOrElse("*"))

  override def view(): String = buildPerm(organizationId,"widget", "view", id.map(_.toString).getOrElse("*"))

  override def create(): String = buildPerm(organizationId,"widget", "create", id.map(_.toString).getOrElse("*"))

  override def edit(): String = buildPerm(organizationId,"widget", "edit", id.map(_.toString).getOrElse("*"))

  override def delete(): String = buildPerm(organizationId,"widget", "delete", id.map(_.toString).getOrElse("*"))

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
