package co.datainsider.jobworker.service.worker2

import co.datainsider.jobworker.domain.JobStatus
import JobStatus.JobStatus

import java.util.concurrent.atomic.AtomicLong
import scala.collection.mutable.ArrayBuffer

case class JobWorkerProgress(
    var status: JobStatus,
    messages: ArrayBuffer[String],
    totalSyncedRows: AtomicLong,
    var lastSyncedValue: String,
    startTime: Long = System.currentTimeMillis()
) {
  def setStatus(jobStatus: JobStatus): Unit = {
    status = jobStatus
  }

  def setLastSyncValue(value: String): Unit = {
    lastSyncedValue = value
  }

  def addMessage(message: String): Unit = {
    messages += message
  }
}

object JobWorkerProgress {
  def default(): JobWorkerProgress = {
    JobWorkerProgress(JobStatus.Syncing, ArrayBuffer.empty, new AtomicLong(), "")
  }
}
