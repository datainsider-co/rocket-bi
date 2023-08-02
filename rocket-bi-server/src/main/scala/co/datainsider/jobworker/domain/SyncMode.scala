package co.datainsider.jobworker.domain

import com.fasterxml.jackson.core.`type`.TypeReference

object SyncMode extends Enumeration {
  type SyncMode = Value
  val FullSync: SyncMode.Value = Value("FullSync")
  val IncrementalSync: SyncMode.Value = Value("IncrementalSync")
}

class SyncModeRef extends TypeReference[SyncMode.type]
