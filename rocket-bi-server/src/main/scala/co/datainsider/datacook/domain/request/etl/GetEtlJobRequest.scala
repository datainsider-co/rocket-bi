package co.datainsider.datacook.domain.request.etl

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.datacook.domain.Ids.EtlJobId

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 2:54 PM
  */
case class GetEtlJobRequest(
    @RouteParam id: EtlJobId,
    @Inject request: Request = null
) extends LoggedInRequest
