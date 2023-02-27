package datainsider.lakescheduler.domain.request

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import com.twitter.finatra.validation.constraints.{Max, Min}
import datainsider.client.filter.LoggedInRequest
import datainsider.jobscheduler.domain.Ids.JobId
import datainsider.jobscheduler.domain.request.SortRequest
import datainsider.lakescheduler.domain.job.LakeJob
import datainsider.lakescheduler.domain.request.ForceRunMode.ForceRunMode

import javax.inject.Inject

case class CreateLakeJobRequest(job: LakeJob, @Inject request: Request) extends LoggedInRequest

case class UpdateLakeJobRequest(@RouteParam id: JobId, job: LakeJob, @Inject request: Request) extends LoggedInRequest

case class DeleteLakeJobRequest(@RouteParam id: Long, @Inject request: Request) extends LoggedInRequest

case class GetLakeJobRequest(@RouteParam id: Long, @Inject request: Request) extends LoggedInRequest

case class ListLakeJobRequest(
    keyword: String = "",
    @Min(0) from: Int = 0,
    @Max(1000) size: Int = 20,
    sorts: Seq[SortRequest] = Seq.empty,
    @Inject request: Request
) extends LoggedInRequest

case class ForceRunRequest(
    @RouteParam id: Long,
    atTime: Long = System.currentTimeMillis(),
    @JsonScalaEnumeration(classOf[ForceRunModeRef]) mode: ForceRunMode = ForceRunMode.Continuous,
    @Inject request: Request = null
) extends LoggedInRequest

class ForceRunModeRef extends TypeReference[ForceRunMode.type]

object ForceRunMode extends Enumeration {
  type ForceRunMode = Value
  val Continuous: ForceRunMode = Value("Continuous")
  val Once: ForceRunMode = Value("Once")
}
