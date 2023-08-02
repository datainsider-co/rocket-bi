package co.datainsider.bi.domain

import com.fasterxml.jackson.annotation.JsonIgnore
import org.apache.shiro.authz.permission.WildcardPermission

case class TokenFullInfo(
                          objectType: String,
                          objectId: String,
                          tokenId: String,
                          creator: String,
                          permissions: Seq[String],
                          createdTime: Option[Long] = None
)

case class PermissionToken(
    tokenId: String,
    creator: String,
    permissions: Seq[String],
    createdTime: Option[Long] = None
) {

  @JsonIgnore
  def isPermitted(permission: String): Boolean = {
    buildWildcardPermissions(permissions)
      .map(_.implies(new WildcardPermission(permission)))
      .exists(x => x)
  }

  private def buildWildcardPermissions(permissions: Seq[String]): Seq[WildcardPermission] = {
    permissions.map(new WildcardPermission(_))
  }
}

case class ObjectPermissionToken(objectType: String, objectId: String, tokenId: String)
