package datainsider.toolscheduler.domain

case class NextJobResponse(runId: Long, toolJob: ToolJob)

case class NextJobInfo(hasNext: Boolean, data: Option[NextJobResponse])
