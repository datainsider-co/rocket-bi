package co.datainsider.common.client.domain.event

abstract class StreamingEvent {
  val dbName: String
  val tblName: String
  val properties: Map[String, Any]
}

class BaseStreamingEvent(
    override val dbName: String,
    override val tblName: String,
    override val properties: Map[String, Any]
) extends StreamingEvent

case class StreamingRequest(
    apiKey: String,
    events: Seq[StreamingEvent],
    timestamp: Long = System.currentTimeMillis()
)
