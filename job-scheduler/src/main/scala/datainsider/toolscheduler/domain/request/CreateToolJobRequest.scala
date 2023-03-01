package datainsider.toolscheduler.domain.request

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.annotations.RouteParam
import datainsider.client.domain.scheduler.ScheduleTime
import datainsider.client.filter.LoggedInRequest
import datainsider.client.util.TimeUtils
import datainsider.jobscheduler.domain.request.{ForceSyncMode, ForceSyncModeRef, SortRequest}
import datainsider.jobscheduler.domain.request.ForceSyncMode.ForceSyncMode
import datainsider.toolscheduler.domain.ToolJobStatus.ToolJobStatus
import datainsider.toolscheduler.domain.ToolJobType.ToolJobType
import datainsider.toolscheduler.domain.{ToolJob, ToolJobStatus, ToolJobType}

import javax.inject.Inject

case class CreateToolJobRequest(
    name: String,
    description: String,
    jobData: Map[String, Any],
    scheduleTime: ScheduleTime,
    jobType: ToolJobType = ToolJobType.DataVerification,
    @Inject request: Request = null
) extends LoggedInRequest {
  def toToolJob(orgId: Long, creatorId: String): ToolJob = {
    val nextRunTime = TimeUtils.calculateNextRunTime(scheduleTime, None)

    ToolJob(
      orgId = orgId,
      name = name,
      description = description,
      jobType = jobType,
      jobData = jobData,
      scheduleTime = scheduleTime,
      lastRunTime = 0L,
      lastRunStatus = ToolJobStatus.Init,
      nextRunTime = nextRunTime,
      currentRunStatus = ToolJobStatus.Init,
      createdBy = creatorId,
      createdAt = System.currentTimeMillis(),
      updatedBy = creatorId,
      updatedAt = System.currentTimeMillis()
    )
  }
}

case class UpdateToolJobRequest(
    name: Option[String] = None,
    description: Option[String] = None,
    jobData: Option[Map[String, Any]] = None,
    jobStatus: Option[ToolJobStatus] = None,
    scheduleTime: Option[ScheduleTime] = None,
    @Inject request: Request = null
) extends LoggedInRequest {

  /**
    * Calculate the next run time of the job.
    * Neu schedule time duoc set, next run time se duoc tinh lai theo schedule time moi.
    * Neu schedule time none, next run time la none
    */
  def calcNextRunTime(): Option[Long] = {
    if (scheduleTime.isDefined) {
      Some(TimeUtils.calculateNextRunTime(scheduleTime.get, None))
    } else {
      None
    }
  }
}

case class ListToolJobRequest(
    from: Int,
    size: Int,
    keyword: String = "",
    sorts: Seq[SortRequest] = Seq.empty,
    @Inject request: Request = null
) extends LoggedInRequest

case class ForceRunRequest(
    @RouteParam id: Long,
    atTime: Long = System.currentTimeMillis(),
    @Inject request: Request = null
) extends LoggedInRequest
