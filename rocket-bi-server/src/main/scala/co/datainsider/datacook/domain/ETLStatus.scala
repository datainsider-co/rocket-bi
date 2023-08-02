package co.datainsider.datacook.domain

import com.fasterxml.jackson.core.`type`.TypeReference

class EtlJobStatusRef extends TypeReference[ETLStatus.type]

object ETLStatus extends Enumeration {
  type ETLStatus = Value
  val Init: ETLStatus.Value = Value("Initialized")
  val Queued: ETLStatus.Value = Value("Queued")
  @deprecated("use Running instead of")
  val Syncing: ETLStatus.Value = Value("Syncing")
  @deprecated("use Done instead of")
  val Synced: ETLStatus.Value = Value("Synced")
  val Running: ETLStatus.Value = Value("Running")
  val Done: ETLStatus.Value = Value("Done")
  val Error: ETLStatus.Value = Value("Error")
  val Terminated: ETLStatus.Value = Value("Terminated")
}
