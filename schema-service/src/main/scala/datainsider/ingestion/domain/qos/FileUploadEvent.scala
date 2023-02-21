package datainsider.ingestion.domain.qos

import datainsider.client.domain.event.StreamingEvent

class FileUploadEvent(
    orgId: Long,
    uploadTime: Long,
    fileName: String,
    filePath: String,
    sizeInByte: Long,
    syncId: Long,
    syncMode: String
) extends StreamingEvent {
  private val DB_NAME = "di_performance"
  private val TBL_NAME = "file_upload"

  private val ORG_ID = "org_id"
  private val UPLOAD_TIME = "upload_time"
  private val FILE_NAME = "file_name"
  private val FILE_PATH = "file_path"
  private val SIZE_IN_BYTE = "size_in_byte"
  private val SYNC_ID = "sync_id"
  private val SYNC_MODE = "sync_mode"

  override val dbName: String = DB_NAME
  override val tblName: String = TBL_NAME
  override val properties: Map[String, Any] = Map(
    ORG_ID -> orgId,
    UPLOAD_TIME -> uploadTime,
    FILE_NAME -> fileName,
    FILE_PATH -> filePath,
    SIZE_IN_BYTE -> sizeInByte,
    SYNC_ID -> syncId,
    SYNC_MODE -> syncMode
  )

}
