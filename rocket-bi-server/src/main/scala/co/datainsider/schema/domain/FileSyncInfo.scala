package co.datainsider.schema.domain

import co.datainsider.schema.domain.SyncStatus.SyncStatus
import co.datainsider.schema.domain.SyncType.SyncType
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

case class FileSyncInfo(
    orgId: Long = 0, // single tenant org id
    syncId: Long = -1,
    name: String,
    path: String,
    @JsonScalaEnumeration(classOf[SyncTypeRef]) syncType: SyncType,
    @JsonScalaEnumeration(classOf[SyncStatusRef]) syncStatus: SyncStatus,
    startTime: Long,
    endTime: Long,
    totalFiles: Int,
    numFailed: Int
)

case class FileSyncHistory(
    orgId: Long = 0, // single tenant org id
    historyId: Long = -1, // dummy id
    syncId: Long,
    fileName: String,
    startTime: Long,
    endTime: Long,
    @JsonScalaEnumeration(classOf[SyncStatusRef]) syncStatus: SyncStatus,
    message: String
)

object SyncType extends Enumeration {
  type SyncType = Value
  val FullSync: SyncType = Value("FullSync")
  val IncrementalSync: SyncType = Value("IncrementalSync")
}

class SyncTypeRef extends TypeReference[SyncType.type]

object SyncStatus extends Enumeration {
  type SyncStatus = Value
  val Syncing: SyncStatus = Value("Syncing")
  val Finished: SyncStatus = Value("Finished")
  val Failed: SyncStatus = Value("Failed")
}

class SyncStatusRef extends TypeReference[SyncStatus.type]

object UploadInfoStr {
  val FULL = "full"
  val INCREMENTAL = "incremental"

  def FullSyncType(historyId: Long, path: String) = s"${FULL}_${historyId}_${path}"
  def IncrementalType(historyId: Long, path: String) = s"${INCREMENTAL}_${historyId}_${path}"
}
