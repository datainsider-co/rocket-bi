package datainsider.toolscheduler.domain

object ToolJobStatus extends Enumeration {
  type ToolJobStatus = String

  val Init: ToolJobStatus = "Initialized"
  val Queued: ToolJobStatus = "Queued"
  val Running: ToolJobStatus = "Running"
  val Finished: ToolJobStatus = "Finished"
  val Error: ToolJobStatus = "Error"
  val Terminated: ToolJobStatus = "Terminated"
  val Canceled: ToolJobStatus = "Canceled"
  val Unknown: ToolJobStatus = "Unknown"
}

object ToolJobType {
  type ToolJobType = String

  val DataVerification = "DataVerification"
}
