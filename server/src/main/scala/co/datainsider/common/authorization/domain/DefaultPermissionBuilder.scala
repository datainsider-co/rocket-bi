package co.datainsider.common.authorization.domain

case class DefaultPermissionBuilder() extends PermissionBuilder {
  def perm(organizationId: Long, domain: String, action: String): String = buildPerm(organizationId, domain, action)

  def perm(organizationId: Long, domain: String, action: String, resourceId: String): String = buildPerm(organizationId, domain, action, resourceId)
}

