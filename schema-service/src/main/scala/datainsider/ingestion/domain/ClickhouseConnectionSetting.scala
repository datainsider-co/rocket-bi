package datainsider.ingestion.domain

case class ClickhouseConnectionSetting(
    host: String,
    username: String,
    password: String,
    httpPort: Int,
    tcpPort: Int,
    clusterName: Option[String] = None,
    useSsl: Boolean = false
) {
  def toJdbcUrl: String = s"jdbc:clickhouse://$host:$httpPort?ssl=$useSsl&socket_timeout=0"
}
