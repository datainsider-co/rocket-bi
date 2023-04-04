package datainsider.jobworker.domain.setting

case class ClickhouseConnectionSetting(
    host: String,
    username: String,
    password: String,
    httpPort: Int,
    tcpPort: Int,
    clusterName: Option[String],
    useSsl: Boolean = false
) {
  def toJdbcUrl: String = s"jdbc:clickhouse://$host:$httpPort?ssl=$useSsl"
}
