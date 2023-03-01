package datainsider.data_cook.domain.request.EtlRequest

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finagle.http.Request
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleTime}
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.EtlJob.ImplicitEtlOperator2Operator
import datainsider.data_cook.domain.{EtlConfig, IncrementalConfig, OperatorInfo}
import datainsider.data_cook.domain.operator.EtlOperator

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 3:00 PM
  */

/**
  * Tạo etl job từ name và danh sách operator.
  * Những operator này là node cuối cùng, không còn operator nào khác sửa dụng
  * @param displayName display name of etl
  * @param operators list operators
  * @param scheduleTime schedule for job
  * @param request base request
  */
case class CreateEtlJobRequest(
    displayName: String,
    operators: Array[EtlOperator],
    scheduleTime: Option[ScheduleTime] = None,
    extraData: Option[JsonNode] = None,
    config: EtlConfig = EtlConfig(),
    @Inject request: Request = null
) extends LoggedInRequest {
  def toOperatorInfo(): OperatorInfo = {
    operators.toOperatorInfo()
  }
}
