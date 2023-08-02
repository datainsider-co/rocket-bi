package co.datainsider.datacook.domain.request.etl

import com.fasterxml.jackson.databind.JsonNode
import com.twitter.finagle.http.Request
import datainsider.client.domain.scheduler.{NoneSchedule, ScheduleTime}
import co.datainsider.caas.user_profile.controller.http.filter.LoggedInRequest
import co.datainsider.datacook.domain.EtlJob.ImplicitEtlOperator2Operator
import co.datainsider.datacook.domain.{EtlConfig, IncrementalConfig, OperatorInfo}
import co.datainsider.datacook.domain.operator.OldOperator

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
                                operators: Array[OldOperator],
                                scheduleTime: Option[ScheduleTime] = None,
                                extraData: Option[JsonNode] = None,
                                config: EtlConfig = EtlConfig(),
                                @Inject request: Request = null
) extends LoggedInRequest {
  def toOperatorInfo(): OperatorInfo = {
    operators.toOperatorInfo()
  }
}
