package co.datainsider.share.controller.request

import co.datainsider.bi.domain.request.PageRequest
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.{QueryParam, RouteParam}
import com.twitter.finatra.validation.constraints.{Min, NotEmpty}
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}
import datainsider.client.filter.LoggedInRequest

import javax.inject.Inject

object ActionUtil {
  def isExistsOtherAction(actions: Seq[String]): Boolean = {
    actions.exists {
      case "view" | "edit" | "delete" | "create" | "copy" => false
      case _                                     => true
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
    ValidationResult.validateNot(
      ActionUtil.isExistsOtherAction(shareIdActions.flatMap(_._2).toSet.toSeq),
      "Support only share with create, view, edit, copy or delete"
    )
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
    ValidationResult.validateNot(
      ActionUtil.isExistsOtherAction(actions),
      "Support only share with create, view, edit or delete"
    )
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
    ValidationResult.validateNot(
      ActionUtil.isExistsOtherAction(actions),
      "Support only share with create, view, edit, copy or delete"
    )
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
    ValidationResult.validateNot(
      ActionUtil.isExistsOtherAction(userActions.flatMap(_._2).toSet.toSeq),
      "Support only share with create, view, edit, copy or delete"
    )
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
