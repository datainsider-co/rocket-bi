package datainsider.ingestion.domain

case class ClickhouseConnectionSetting(
    host: String,
    username: String,
    password: String,
    httpPort: Int,
    tcpPort: Int,
    clusterName: String
) {
  def toJdbcUrl: String = s"jdbc:clickhouse://$host:$httpPort?socket_timeout=0"
}
