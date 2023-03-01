package datainsider.toolscheduler.domain

import datainsider.toolscheduler.domain.ToolJobStatus.ToolJobStatus
import datainsider.toolscheduler.domain.ToolJobType.ToolJobType

case class ToolJobHistory(
    runId: Long = 0L, // dummy id
    orgId: Long,
    jobId: Long,
    jobName: String,
    jobType: ToolJobType,
    jobStatus: ToolJobStatus,
    jobData: Map[String, Any],
    historyData: Map[String, Any],
    beginAt: Long,
    endAt: Long,
    message: String
)
