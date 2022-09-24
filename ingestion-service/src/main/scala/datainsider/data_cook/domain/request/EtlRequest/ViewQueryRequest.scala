package datainsider.data_cook.domain.request.EtlRequest

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.{ExpressionFieldConfiguration, NormalFieldConfiguration}

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 10/26/2021 - 5:01 PM
  */

/**
 * View query from list fields and extra fields
 */
case class ViewQueryRequest(@RouteParam id: EtlJobId,
                            fields: Array[NormalFieldConfiguration] = Array.empty,
                            extraFields: Array[ExpressionFieldConfiguration] = Array.empty,
                            @Inject request: Request = null) extends LoggedInRequest
