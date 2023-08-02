package co.datainsider.license.domain

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import co.datainsider.license.domain.LicenseStatus.LicenseStatus
import co.datainsider.license.domain.LicenseType.LicenseType
import co.datainsider.license.domain.permissions.{Permission, Usage}

case class License(
    key: String = null,
    permissions: Map[String, Permission],
    @JsonScalaEnumeration(classOf[LicenseTypeRef])
    licenseType: LicenseType,
    @JsonScalaEnumeration(classOf[LicenseStatusRef])
    status: LicenseStatus,
    createdAt: Long = System.currentTimeMillis(),
    updatedAt: Long = System.currentTimeMillis()
) {
  def verify(usage: Usage): Boolean = {
    permissions.get(usage.permissionKey) match {
      case Some(targetPerm) => targetPerm.verify(usage)
      case None             => false
    }
  }

  def mergePermissions(newPermissions: Seq[Permission]): License = {
    val newPermissionsMap: Map[String, Permission] = newPermissions.map(p => p.key -> p).toMap

    this.copy(
      permissions = permissions ++ newPermissionsMap
    )
  }
}

object LicenseStatus extends Enumeration {
  type LicenseStatus = Value
  val Active: LicenseStatus = Value("Active")
  val Inactive: LicenseStatus = Value("Inactive")
  val Suspended: LicenseStatus = Value("Suspended")
}

class LicenseStatusRef extends TypeReference[LicenseStatus.type]

object LicenseType extends Enumeration {
  type LicenseType = Value
  val Saas: LicenseType = Value("Saas")
  val Oss: LicenseType = Value("Oss")
  val OnPremise: LicenseType = Value("OnPremise")
}

class LicenseTypeRef extends TypeReference[LicenseType.type]

object LicensePermission {
  val ViewData = "view_data"
  val EditData = "edit_data"
}
