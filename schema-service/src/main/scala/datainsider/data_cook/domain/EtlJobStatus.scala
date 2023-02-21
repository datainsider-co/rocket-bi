package datainsider.data_cook.domain

import com.fasterxml.jackson.core.`type`.TypeReference

class EtlJobStatusRef extends TypeReference[EtlJobStatus.type]

object EtlJobStatus extends Enumeration {
  type EtlJobStatus = Value
  val Init: EtlJobStatus.Value = Value("Initialized")
  val Queued: EtlJobStatus.Value = Value("Queued")
  @deprecated("use Running instead of")
  val Syncing: EtlJobStatus.Value = Value("Syncing")
  @deprecated("use Done instead of")
  val Synced: EtlJobStatus.Value = Value("Synced")
  val Running: EtlJobStatus.Value = Value("Running")
  val Done: EtlJobStatus.Value = Value("Done")
  val Error: EtlJobStatus.Value = Value("Error")
  val Terminated: EtlJobStatus.Value = Value("Terminated")
  val Unknown: EtlJobStatus.Value = Value("Unknown")
}
