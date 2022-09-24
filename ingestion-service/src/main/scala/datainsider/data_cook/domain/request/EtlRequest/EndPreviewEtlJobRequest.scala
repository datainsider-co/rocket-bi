package datainsider.data_cook.domain.request.EtlRequest

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.EtlOperator

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/23/2021 - 11:07 AM
  */
case class EndPreviewEtlJobRequest(
    @RouteParam id: EtlJobId,
    @Inject request: Request = null
) extends LoggedInRequest
