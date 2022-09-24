package datainsider.data_cook.domain.request.EtlRequest

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import datainsider.client.domain.scheduler.ScheduleTime
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.{EtlConfig, IncrementalConfig}
import datainsider.data_cook.domain.operator.EtlOperator

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 3:00 PM
  */

/**
  * Edit etl job
  * @param id id hiện tại của etl, update thông tin của etl job, nếu None thì không update property đó.
  * @param displayName display name muốn chỉnh sửa
  * @param operators operators đang có
  * @param scheduleTime setup time cho schedule
  * @param request base request
  */
case class UpdateEtlJobRequest(
    @RouteParam id: EtlJobId,
    displayName: Option[String] = None,
    operators: Option[Array[EtlOperator]] = None,
    scheduleTime: Option[ScheduleTime] = None,
    extraData: Option[JsonNode] = None,
    config: Option[EtlConfig] = None,
    @Inject request: Request = null
) extends LoggedInRequest
