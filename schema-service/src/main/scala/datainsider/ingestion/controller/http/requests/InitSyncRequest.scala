package datainsider.ingestion.controller.http.requests

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
