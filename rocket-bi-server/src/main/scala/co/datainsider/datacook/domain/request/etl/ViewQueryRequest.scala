package co.datainsider.datacook.domain.request.etl

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.domain.operator.{ExpressionFieldConfiguration, NormalFieldConfiguration}

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 10/26/2021 - 5:01 PM
  */

/**
  * View query from list fields and extra fields
  */
case class ViewQueryRequest(
    @RouteParam id: EtlJobId,
    fields: Array[NormalFieldConfiguration] = Array.empty,
    extraFields: Array[ExpressionFieldConfiguration] = Array.empty,
    @Inject request: Request = null
) extends LoggedInRequest
