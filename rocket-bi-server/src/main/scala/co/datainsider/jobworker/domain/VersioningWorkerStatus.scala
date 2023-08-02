package co.datainsider.jobworker.domain

case class VersioningWorkerStatus(
    isRunning: Boolean,
    curDeletedTablesCount: Int,
    curDeleteErrorsCount: Int,
    finalTotalTablesNum: Int,
    finalTmpTablesNum: Int,
    executionTime: Long
)
