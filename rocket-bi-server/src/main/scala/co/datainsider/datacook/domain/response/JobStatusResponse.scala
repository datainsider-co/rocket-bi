package co.datainsider.datacook.domain.response

case class JobStatusResponse(
    isRunning: Boolean,
    jobQueueSize: Long,
    totalJobCompleted: Long,
    numberJobRunning: Long
)
