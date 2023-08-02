package co.datainsider.datacook.domain.request.share

import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.datacook.domain.Ids.{EtlJobId, UserId}
import co.datainsider.share.controller.request.ActionUtil
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.NotEmpty
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}

import javax.inject.Inject

/**
  * share etl to user
  * @param id etl id
  * @param userActions user and actions as Map
  * @param request base request
  */
case class ShareEtlToUsersRequest(
    @RouteParam id: EtlJobId,
    @NotEmpty userActions: Map[UserId, Seq[String]],
    @Inject request: Request = null
) extends LoggedInRequest {
  @MethodValidation
  def validateShareIdActions(): ValidationResult = {
    val actions: Set[String] = userActions.flatMap(_._2).toSet
    ActionUtil.validActions(actions)
  }
}
