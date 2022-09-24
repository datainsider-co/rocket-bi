package datainsider.data_cook.domain.request.ShareRequest
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.Ids.{EtlJobId, UserId}

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
