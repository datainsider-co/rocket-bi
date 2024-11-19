package co.datainsider.schema.domain.requests

import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.share.controller.request.ActionUtil
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.{QueryParam, RouteParam}
import com.twitter.finatra.validation.constraints.{Min, NotEmpty}
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}

import javax.inject.Inject

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
    val actions: Set[String] = userActions.flatMap(_._2).toSet
    ActionUtil.validActions(actions)
  }
}

case class MultiUpdateResourceSharingRequest(
    @RouteParam dbName: String,
    @NotEmpty shareIdActions: Map[String, Seq[String]],
    @Inject request: Request = null
) extends LoggedInRequest {
  @MethodValidation
  def validateShareIdActions(): ValidationResult = {
    val actions: Set[String] = shareIdActions.flatMap(_._2).toSet
    ActionUtil.validActions(actions)
  }
}

case class RevokeDatabasePermissionsRequest(
    @RouteParam dbName: String,
    @NotEmpty usernames: Seq[String],
    @Inject request: Request = null
) extends LoggedInRequest
