package datainsider.user_profile.controller.http.request

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.filter.LoggedInRequest

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
