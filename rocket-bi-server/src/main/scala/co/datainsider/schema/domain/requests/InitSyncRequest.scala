package co.datainsider.schema.domain.requests

case class InitSyncRequest(
    name: String,
    path: String,
    apiKey: String,
    syncType: String
)

case class EndSyncRequest(
    syncId: Long,
    apiKey: String
)

case class VerifySyncRequest(
    syncId: Long,
    fileName: String,
    apiKey: String
)

case class RecordFileHistory(
    historyId: Long,
    success: Boolean,
    message: String
)
