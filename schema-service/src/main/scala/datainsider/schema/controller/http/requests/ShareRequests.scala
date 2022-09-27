package datainsider.schema.controller.http.requests

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
      case _                                              => true
    }
  }
}

object PermResourceType extends Enumeration {
  val Database: Value = Value("database")
  val ETL: Value = Value("etl")
}

case class GetResourceSharingInfoRequest(
    @RouteParam dbName: String,
    @QueryParam @Min(0) from: Int = 0,
    @QueryParam @Min(1) size: Int = 20,
    @Inject request: Request = null
) extends LoggedInRequest

case class ShareWithUserRequest(
    @RouteParam dbName: String,
    @NotEmpty userActions: Map[String, Seq[String]],
    @Inject request: Request = null
) extends LoggedInRequest {
  @MethodValidation
  def validateShareIdActions(): ValidationResult = {
    ValidationResult.validateNot(
      ActionUtil.isExistsOtherAction(userActions.flatMap(_._2).toSet.toSeq),
      "Support only share with create, view, edit, copy or delete"
    )
  }
}

case class MultiUpdateResourceSharingRequest(
    @RouteParam dbName: String,
    @NotEmpty shareIdActions: Map[String, Seq[String]],
    @Inject request: Request = null
) extends LoggedInRequest {
  @MethodValidation
  def validateShareIdActions(): ValidationResult = {
    ValidationResult.validateNot(
      ActionUtil.isExistsOtherAction(shareIdActions.flatMap(_._2).toSet.toSeq),
      "Support only share with create, view, edit, copy or delete"
    )
  }
}

case class RevokeDatabasePermissionsRequest(
    @RouteParam dbName: String,
    @NotEmpty usernames: Seq[String],
    @Inject request: Request = null
) extends LoggedInRequest

case class ListPermissionsRequest(
    @RouteParam dbName: String,
    @NotEmpty userName: String,
    @Inject request: Request = null
) extends LoggedInRequest
