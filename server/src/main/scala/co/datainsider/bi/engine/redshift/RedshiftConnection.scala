package co.datainsider.bi.engine.redshift

import co.datainsider.bi.domain.{Connection, SshConfig, TunnelConnection}

case class RedshiftConnection(
    orgId: Long = -1,
    host: String,
    port: Int,
    username: String,
    password: String,
    database: String,
    tunnelConfig: Option[SshConfig] = None,
    properties: Map[String, String] = Map("ssl" -> "false", "TimeZone" -> "GMT"),
    createdBy: String = null,
    updatedBy: String = null,
    createdAt: Long = System.currentTimeMillis(),
    updatedAt: Long = System.currentTimeMillis()
) extends TunnelConnection {

  def jdbcUrl: String = {
    s"jdbc:redshift://$host:$port/$database"
  }

  override def customCopy(
      orgId: Long,
      createdBy: String,
      updatedBy: String,
      createdAt: Long,
      updatedAt: Long
  ): Connection = {
    this.copy(
      orgId = orgId,
      createdBy = createdBy,
      updatedBy = updatedBy,
      createdAt = createdAt,
      updatedAt = updatedAt
    )
  }

  override def getRemoteHost(): String = host

  override def getRemotePorts(): Seq[Int] = Seq(port)

  override def copyHostPorts(host: String, newPortAsMap: Map[Int, Int]): RedshiftConnection = {
    this.copy(
      host = host,
      port = newPortAsMap.getOrElse(port, port)
    )
  }

  override def isDifferent(other: Connection): Boolean = {
    other match {
      case other: RedshiftConnection =>
        this.host != other.host ||
          this.port != other.port ||
          this.tunnelConfig != other.tunnelConfig ||
          this.properties != other.properties ||
          this.username != other.username ||
          this.password != other.password ||
          this.database != other.database ||
          this.orgId != other.orgId
      case _ => true
    }
  }
}
