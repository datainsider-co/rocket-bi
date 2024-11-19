package co.datainsider.common.authorization.domain

object PermissionByUserProviders {
  def adminUser = AdminUserPermissionProvider()
}

trait PermissionProvider {
  def allPermissions(organizationId: Long): Set[String]
}

trait CURDPermissionProvider extends PermissionProvider {
  def all(): String
  def view(): String
  def create(): String
  def edit(): String
  def delete(): String
}

trait PermissionBuilder {
  protected def buildPerm(organizationId: Long, domain: String): String = {
    buildPerm(organizationId, domain, "*")
  }
  protected def buildPerm(organizationId: Long, domain: String, action: String): String = {
    buildPerm(organizationId, domain, action, "*")
  }

  protected def buildPerm(organizationId: Long, domain: String, action: String, resourceId: String): String = {
    s"$organizationId:$domain:$action:$resourceId"
  }

  protected def buildPerm(parts: Seq[String]): String = {
    parts.mkString(":")
  }
}

case class AdminUserPermissionProvider() extends PermissionProvider with PermissionBuilder {
  override def allPermissions(organizationId: Long): Set[String] = {
    Set(
      buildPerm(organizationId, "*", "*", "*"),
    )
  }
}
