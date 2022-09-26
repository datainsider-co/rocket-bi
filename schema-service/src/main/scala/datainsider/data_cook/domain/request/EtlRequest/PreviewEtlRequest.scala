package datainsider.data_cook.domain.request.EtlRequest

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.{Max, Min}
import com.twitter.finatra.validation.{MethodValidation, ValidationResult}
import datainsider.client.domain.scheduler.NoneSchedule
import datainsider.client.filter.LoggedInRequest
import datainsider.data_cook.domain.EtlJob.ImplicitEtlOperator2Operator
import datainsider.data_cook.domain.{EtlConfig, EtlJob, EtlJobStatus, IncrementalConfig, OperatorInfo}
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.domain.operator.EtlOperator

import javax.inject.Inject

/**
  * @author tvc12 - Thien Vi
  * @created 09/23/2021 - 11:07 AM
  */

/**
  * Preview etl job request
  *
  * @param id - id of etl
  * @param operators - operators for preview
  * @param force - force reload data
  */
case class PreviewEtlRequest(
    @RouteParam id: EtlJobId,
    operators: Array[EtlOperator],
    force: Boolean = false,
    @Min(1) @Max(5000) sampleSize: Int = 500,
    config: Option[EtlConfig] = None,
    @Inject request: Request = null
) extends LoggedInRequest {

  @MethodValidation
  def validateOperator(): ValidationResult = {
    try {
      operators.foreach(_.validate())
      ValidationResult.Valid()
    } catch {
      case ex: Throwable => ValidationResult.Invalid(ex.getMessage)
    }
  }

  def toPreviewJob(): EtlJob = {
    val job = EtlJob(
      id,
      currentOrganizationId.get,
      "Preview ETL Job",
      operators,
      ownerId = "",
      NoneSchedule(),
      nextExecuteTime = 0L,
      status = EtlJobStatus.Init,
      operatorInfo = operators.toOperatorInfo(),
      config = config.getOrElse(EtlConfig())
    )

    EtlJob.toPreviewJob(job)
  }
}
