package datainsider.data_cook.domain.response

case class JobStatusResponse(
    isRunning: Boolean,
    jobQueueSize: Long,
    totalJobCompleted: Long,
    numberJobRunning: Long
)
