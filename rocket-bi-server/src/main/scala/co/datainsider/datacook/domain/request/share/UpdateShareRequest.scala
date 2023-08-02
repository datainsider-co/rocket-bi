package co.datainsider.datacook.domain.request.share

import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.datacook.domain.Ids.{EtlJobId, ShareId}
import co.datainsider.share.controller.request.ActionUtil
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.NotEmpty
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}

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
    val actions: Set[String] = shareIdActions.flatMap(_._2).toSet
    ActionUtil.validActions(actions)
  }
}
