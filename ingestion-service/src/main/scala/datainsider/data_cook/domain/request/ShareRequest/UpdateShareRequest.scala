package datainsider.data_cook.domain.request.ShareRequest
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.NotEmpty
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.Ids.{EtlJobId, ShareId}
import datainsider.ingestion.controller.http.requests.ActionUtil

import javax.inject.Inject

/**
  * Update share
  * @param id etl id
  * @param shareIdActions share id and action as map
  * @param request base request
  */
case class UpdateShareRequest(
    @RouteParam id: EtlJobId,
    @NotEmpty shareIdActions: Map[ShareId, Seq[String]],
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
