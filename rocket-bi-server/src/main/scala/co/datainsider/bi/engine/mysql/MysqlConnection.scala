package co.datainsider.bi.engine.mysql

import co.datainsider.bi.domain.{Connection, SshConfig, TunnelConnection}

/**
  * created 2023-06-27 10:37 AM
  *
  * @author tvc12 - Thien Vi
  */
case class MysqlConnection(
                            orgId: Long = -1,
                            host: String,
                            port: Int,
                            username: String,
                            password: String,
                            tunnelConfig: Option[SshConfig] = None,
                            properties: Map[String, String] = Map.empty,
                            createdBy: String = null,
                            updatedBy: String = null,
                            createdAt: Long = System.currentTimeMillis(),
                            updatedAt: Long = System.currentTimeMillis()
) extends TunnelConnection {

  def jdbcUrl: String = {
    s"jdbc:mysql://$host:$port"
  }

  override def getRemoteHost(): String = host

  override def getRemotePorts(): Seq[Int] = Seq(port)

  override def copyHostPorts(host: String, ports: Seq[Int]): MysqlConnection = {
    this.copy(host = host, port = ports.headOption.getOrElse(port))
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
}
