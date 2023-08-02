package co.datainsider.jobworker.domain

import com.fasterxml.jackson.core.`type`.TypeReference

object JobStatus extends Enumeration {
  type JobStatus = Value
  val Init: JobStatus.Value = Value("Initialized")
  val Queued: JobStatus.Value = Value("Queued")
  val Syncing: JobStatus.Value = Value("Syncing")
  val Synced: JobStatus.Value = Value("Synced")
  val Error: JobStatus.Value = Value("Error")
  val Terminated: JobStatus.Value = Value("Terminated")
  val Unknown: JobStatus.Value = Value("Unknown")
}

class JobStatusRef extends TypeReference[JobStatus.type]
