package co.datainsider.datacook.domain.request.etl

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.OldOperator

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/23/2021 - 11:07 AM
  */
case class EndPreviewEtlJobRequest(
    @RouteParam id: EtlJobId,
    @Inject request: Request = null
) extends LoggedInRequest
