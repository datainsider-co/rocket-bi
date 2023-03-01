package datainsider.lakescheduler.domain.response

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import datainsider.jobscheduler.domain.Ids.{JobId, RunId}
import datainsider.lakescheduler.domain.job.LakeJobStatus.LakeJobStatus
import datainsider.lakescheduler.domain.job.LakeJobStatusRef

case class LakeHistoryResponse(
    runId: RunId = 0,
    jobId: JobId,
    jobName: String,
    startTime: Long,
    updatedTime: Long,
    endTime: Long,
    @JsonScalaEnumeration(classOf[LakeJobStatusRef]) jobStatus: LakeJobStatus,
    logPath: Option[String],
    message: String
)
