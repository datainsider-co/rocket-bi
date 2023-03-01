package datainsider.toolscheduler.domain

import datainsider.client.domain.scheduler.ScheduleTime
import datainsider.toolscheduler.domain.ToolJobStatus.ToolJobStatus
import datainsider.toolscheduler.domain.ToolJobType.ToolJobType

case class ToolJob(
    jobId: Long = 0, // dummy id
    orgId: Long,
    name: String,
    description: String,
    jobType: ToolJobType,
    jobData: Map[String, Any],
    scheduleTime: ScheduleTime,
    lastRunTime: Long,
    lastRunStatus: ToolJobStatus,
    nextRunTime: Long,
    currentRunStatus: ToolJobStatus,
    createdBy: String,
    createdAt: Long,
    updatedBy: String,
    updatedAt: Long
) {
  def toNewJobHistory(): ToolJobHistory = {
    ToolJobHistory(
      orgId = orgId,
      jobId = jobId,
      jobName = name,
      beginAt = System.currentTimeMillis(),
      endAt = 0L,
      jobStatus = ToolJobStatus.Queued,
      jobType = jobType,
      jobData = jobData,
      historyData = Map.empty,
      message = ""
    )
  }
}
