package co.datainsider.datacook.domain.request.share

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.NotEmpty
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.datacook.domain.Ids.{EtlJobId, UserId}

import javax.inject.Inject

/**
  * revoke share
  * @param id etl id
  * @param usernames username for revoke permission
  * @param request base request
  */
case class RevokeShareRequest(
    @RouteParam id: EtlJobId,
    @NotEmpty usernames: Seq[UserId],
    @Inject request: Request = null
) extends LoggedInRequest
