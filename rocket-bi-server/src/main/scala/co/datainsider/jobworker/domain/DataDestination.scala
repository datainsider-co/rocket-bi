package co.datainsider.jobworker.domain

object DataDestination extends Enumeration {
  type DataDestination = String
  val Clickhouse: DataDestination = "Clickhouse"
  val Hadoop: DataDestination = "Hadoop"
}
