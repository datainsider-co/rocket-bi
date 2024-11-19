package co.datainsider.share.controller.request

import co.datainsider.bi.domain.request.PageRequest
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.{QueryParam, RouteParam}
import com.twitter.finatra.validation.constraints.{Min, NotEmpty}
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}

import javax.inject.Inject

object ActionUtil {
  val ALL_ACTIONS: Set[String] = Set("view", "edit", "create", "delete", "copy", "share", "download", "*")

  def validActions(actions: Set[String]): ValidationResult = {
    val invalidActions: Set[String] = actions.diff(ALL_ACTIONS)
    if (invalidActions.isEmpty) {
      ValidationResult.Valid()
    } else {
      ValidationResult.Invalid(s"Invalid actions: ${invalidActions.mkString(",")}")
    }
  }
}

trait ShareRequest {
  def resourceType(): String

  def resourceId(): String
}

case class GetResourceSharingInfoRequest(
    @RouteParam resourceType: String,
    @RouteParam resourceId: String,
    @QueryParam @Min(0) from: Int = 0,
    @QueryParam @Min(1) size: Int = 20,
    @Inject request: Request = null
) extends ShareRequest
    with LoggedInRequest
    with PageRequest

case class MultiUpdateResourceSharingRequest(
    @RouteParam resourceType: String,
    @RouteParam resourceId: String,
    @NotEmpty shareIdActions: Map[String, Seq[String]],
    @Inject request: Request = null
) extends ShareRequest
    with LoggedInRequest {
  @MethodValidation
  def validateShareIdActions(): ValidationResult = {
    val actions: Set[String] = shareIdActions.flatMap(_._2).toSet
    ActionUtil.validActions(actions)
  }
}

case class ShareAnyoneRequest(
    @RouteParam resourceType: String,
    @RouteParam resourceId: String,
    @NotEmpty actions: Seq[String],
    @Inject request: Request = null
) extends ShareRequest
    with LoggedInRequest {
  @MethodValidation
  def validateActions(): ValidationResult = {
    ActionUtil.validActions(actions.toSet)
  }
}

case class UpdateShareAnyoneRequest(
    @RouteParam resourceType: String,
    @RouteParam resourceId: String,
    @NotEmpty actions: Seq[String],
    @Inject request: Request = null
) extends ShareRequest
    with LoggedInRequest {
  @MethodValidation
  def validateActions(): ValidationResult = {
    ActionUtil.validActions(actions.toSet)
  }
}
case class RevokeShareRequest(
    @RouteParam resourceType: String,
    @RouteParam resourceId: String,
    @NotEmpty usernames: Seq[String],
    @Inject request: Request = null
) extends ShareRequest
    with LoggedInRequest

case class ShareWithUserRequest(
    @RouteParam resourceType: String,
    @RouteParam resourceId: String,
    @NotEmpty userActions: Map[String, Seq[String]],
    @Inject request: Request = null
) extends ShareRequest
    with LoggedInRequest {

  @MethodValidation
  def validateUserActions(): ValidationResult = {
    val actions: Set[String] = userActions.flatMap(_._2).toSet
    ActionUtil.validActions(actions)
  }
}

case class RevokeShareAnyoneRequest(
    @RouteParam resourceType: String,
    @RouteParam resourceId: String,
    @Inject request: Request = null
) extends ShareRequest
    with LoggedInRequest

case class GetShareAnyoneInfoRequest(
    @RouteParam resourceType: String,
    @RouteParam resourceId: String,
    @Inject request: Request = null
) extends ShareRequest
    with LoggedInRequest

case class CheckActionPermittedRequest(
    @RouteParam resourceType: String,
    @RouteParam resourceId: String,
    @NotEmpty actions: Seq[String],
    @Inject request: Request = null
) extends ShareRequest
    with LoggedInRequest
