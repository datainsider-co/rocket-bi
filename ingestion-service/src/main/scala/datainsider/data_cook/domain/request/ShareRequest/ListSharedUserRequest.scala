package datainsider.data_cook.domain.request.ShareRequest

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.{QueryParam, RouteParam}
import com.twitter.finatra.validation.constraints.Min
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.Ids.EtlJobId

import javax.inject.Inject

/**
  * List shared user of etl
  * @param id etl id
  * @param from get user from
  * @param size size of list
  * @param request
  */
case class ListSharedUserRequest(
    @RouteParam id: EtlJobId,
    @QueryParam @Min(0) from: Int = 0,
    @QueryParam @Min(1) size: Int = 20,
    @Inject request: Request = null
) extends LoggedInRequest
