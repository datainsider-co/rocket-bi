package co.datainsider.caas.user_profile.controller.http.request

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.NotEmpty
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.caas.user_caas.domain.UserGroup.UserGroup
import co.datainsider.caas.user_caas.domain.UserGroupRef

import javax.inject.Inject

case class GetMyPermissionsRequest(
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = currentOrganization.map(_.organizationId).get
}

case class CheckMyPermissionPermittedRequest(
    @NotEmpty permissions: Seq[String],
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = currentOrganization.map(_.organizationId).get
}

case class GetAllPermissionsRequest(
    @RouteParam @NotEmpty username: String,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = currentOrganization.map(_.organizationId).get
}

case class CheckPermissionPermittedRequest(
    @RouteParam @NotEmpty username: String,
    @NotEmpty permissions: Seq[String],
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = currentOrganization.map(_.organizationId).get
}

case class ChangePermissionRequest(
    @RouteParam @NotEmpty username: String,
    includePermissions: Set[String] = Set.empty,
    excludePermissions: Set[String] = Set.empty,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = currentOrganization.map(_.organizationId).get
}

case class GetUserGroupRequest(
    @RouteParam @NotEmpty username: String,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = currentOrganization.map(_.organizationId).get
}

case class AssignUserGroupRequest(
    @RouteParam @NotEmpty username: String,
    @JsonScalaEnumeration(classOf[UserGroupRef])
    userGroup: UserGroup,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = currentOrganization.map(_.organizationId).get
}
