package datainsider.analytics.domain

import com.fasterxml.jackson.core.`type`.TypeReference

object ReportType extends scala.Enumeration {
  type ReportType = Value
  val ActiveUsers: ReportType = Value("active_users")
}
class ReportTypeTypeRef extends TypeReference[ReportType.type]

object JobStatus extends scala.Enumeration {
  type JobStatus = Value
  val Idle: JobStatus = Value("idle")
  val Waiting: JobStatus = Value("waiting")
  val Running: JobStatus = Value("running")
  val Done: JobStatus = Value("done")
  val Aborted: JobStatus = Value("aborted")
  val Failed: JobStatus = Value("failed")
}

class JobStatusTypeRef extends TypeReference[JobStatus.type]
