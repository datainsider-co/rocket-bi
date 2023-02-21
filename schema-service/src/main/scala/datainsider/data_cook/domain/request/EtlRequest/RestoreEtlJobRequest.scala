package datainsider.data_cook.domain.request.EtlRequest

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.Ids.EtlJobId

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 3:00 PM
  */
case class RestoreEtlJobRequest(
    @RouteParam id: EtlJobId,
    @Inject request: Request = null
) extends LoggedInRequest
