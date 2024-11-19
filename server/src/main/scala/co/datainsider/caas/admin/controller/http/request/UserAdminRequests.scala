package co.datainsider.caas.admin.controller.http.request

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.{QueryParam, RouteParam}
import com.twitter.finatra.validation.constraints.{Max, Min, NotEmpty}
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.caas.user_caas.domain.UserType.UserType
import co.datainsider.caas.user_caas.domain.{UserType, UserTypeRef}
import co.datainsider.caas.user_profile.controller.http.request.PagingRequest

import javax.inject.Inject

/**
  * @author anhlt
  */
case class SearchUserRequest(
    @QueryParam keyword: String = "",
    @deprecated("unused variable, will remove next version", "08/09/2022")
    @QueryParam isActive: Option[Boolean] = None,
    @QueryParam @Min(0) from: Option[Int] = Some(0),
    @QueryParam @Min(1) @Max(200) size: Option[Int] = Some(20),
    @QueryParam
    @JsonScalaEnumeration(classOf[UserTypeRef])
    userType: Option[UserType] = Some(UserType.User),
    @Inject request: Request
) extends PagingRequest
    with LoggedInRequest

case class GetUserDetailRequest(
    @RouteParam @NotEmpty username: String,
    @Inject request: Request
) extends LoggedInRequest {
  def organizationId: Long = currentOrganization.map(_.organizationId).get
}

case class ActivateRequest(
    @RouteParam @NotEmpty username: String,
    @Inject request: Request
) extends LoggedInRequest

case class DeactivateRequest(
    @RouteParam @NotEmpty username: String,
    @Inject request: Request
) extends LoggedInRequest

case class DeleteUserRequest(
    @RouteParam @NotEmpty username: String,
    transferToEmail: Option[String] = None,
    @Inject request: Request
) extends LoggedInRequest {
  @MethodValidation
  def validate(): ValidationResult = {
    if (transferToEmail.isDefined) {
      ValidationResult.validateNot(transferToEmail == null, "The target user's email cannot be empty.")
    } else {
      ValidationResult.Valid()
    }
  }
}

case class ResetPasswordRequest(
    @RouteParam @NotEmpty username: String,
    @Inject request: Request
) extends LoggedInRequest

case class EditUserPropertyRequest(
    @QueryParam username: String,
    properties: Map[String, String] = Map.empty,
    // danh sach cac key can delete trong properties
    deletedPropertyKeys: Set[String] = Set.empty,
    @Inject request: Request
) extends LoggedInRequest
