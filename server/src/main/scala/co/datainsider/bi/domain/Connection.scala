package co.datainsider.bi.domain

import co.datainsider.bi.engine.mysql.MysqlConnection
import co.datainsider.bi.engine.posgresql.PostgreSqlConnection
import co.datainsider.bi.engine.redshift.RedshiftConnection
import co.datainsider.bi.engine.vertica.VerticaConnection
import com.fasterxml.jackson.annotation.JsonSubTypes.Type
import com.fasterxml.jackson.annotation.{JsonIgnore, JsonIgnoreProperties, JsonSubTypes, JsonTypeInfo}
import com.twitter.finatra.validation.constraints.Min

/**
  * created 2023-05-30 11:01 AM
  *
  * @author tvc12 - Thien Vi
  */
@JsonTypeInfo(
  use = JsonTypeInfo.Id.NAME,
  include = JsonTypeInfo.As.PROPERTY,
  property = "class_name"
)
@JsonSubTypes(
  Array(
    new Type(value = classOf[ClickhouseConnection], name = "clickhouse_connection"),
    new Type(value = classOf[BigQueryConnection], name = "bigquery_connection"),
    new Type(value = classOf[MysqlConnection], name = "mysql_connection"),
    new Type(value = classOf[VerticaConnection], name = "vertica_connection"),
    new Type(value = classOf[PostgreSqlConnection], name = "postgresql_connection"),
    new Type(value = classOf[RedshiftConnection], name = "redshift_connection")
  )
)
trait Connection {
  def orgId: Long

  def createdBy: String

  def updatedBy: String

  def createdAt: Long

  def updatedAt: Long

  def customCopy(
      orgId: Long = this.orgId,
      createdBy: String = this.createdBy,
      updatedBy: String = this.updatedBy,
      createdAt: Long = this.createdAt,
      updatedAt: Long = this.updatedAt
  ): Connection

  /**
    * check if this connection is different from other connection
    */
  def isDifferent(other: Connection): Boolean
}

trait TunnelConnection extends Connection {

  def getTunnelId(): String = {
    tunnelConfig match {
      case Some(config) => s"$orgId:${config.host}:${config.port}:${config.username}"
      case None         => s"$orgId:no_tunnel"
    }
  }

  def tunnelConfig: Option[SshConfig]

  @JsonIgnoreProperties
  @JsonIgnore
  def getRemoteHost(): String

  @JsonIgnoreProperties
  @JsonIgnore
  def getRemotePorts(): Seq[Int]

  /**
    * copy host and ports to new connection
    * @param host new host
    * @param oldToNewPortMap key: old port, value: new port, if new port is not defined, use old port
    */
  def copyHostPorts(host: String, oldToNewPortMap: Map[Int, Int]): TunnelConnection
}

case class ClickhouseConnection(
    orgId: Long = -1,
    host: String,
    username: String,
    password: String,
    httpPort: Int,
    tcpPort: Int,
    useSsl: Boolean = false,
    clusterName: Option[String] = None,
    tunnelConfig: Option[SshConfig] = None,
    properties: Map[String, String] = Map.empty,
    createdBy: String = null,
    updatedBy: String = null,
    createdAt: Long = System.currentTimeMillis(),
    updatedAt: Long = System.currentTimeMillis()
) extends TunnelConnection {
  def toJdbcUrl: String = s"jdbc:clickhouse://$host:$httpPort?ssl=$useSsl"

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

  override def getRemotePorts(): Seq[Int] = Seq(httpPort, tcpPort)

  override def copyHostPorts(host: String, oldToNewPortMap: Map[Int, Int]): ClickhouseConnection = {
    this.copy(
      host = host,
      httpPort = oldToNewPortMap.getOrElse(httpPort, httpPort),
      tcpPort = oldToNewPortMap.getOrElse(tcpPort, tcpPort)
    )
  }

  override def isDifferent(other: Connection): Boolean = {
    other match {
      case other: ClickhouseConnection =>
        this.host != other.host ||
          this.httpPort != other.httpPort ||
          this.tcpPort != other.tcpPort ||
          this.useSsl != other.useSsl ||
          this.clusterName != other.clusterName ||
          this.tunnelConfig != other.tunnelConfig ||
          this.properties != other.properties ||
          this.username != other.username ||
          this.password != other.password ||
          this.orgId != other.orgId
      case _ => true
    }
  }
}

case class BigQueryConnection(
    orgId: Long = -1,
    projectId: String,
    credentials: String,
    location: Option[String] = None,
    createdBy: String = null,
    updatedBy: String = null,
    createdAt: Long = System.currentTimeMillis(),
    updatedAt: Long = System.currentTimeMillis()
) extends Connection {
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

  override def isDifferent(other: Connection): Boolean = {
    other match {
      case other: BigQueryConnection =>
        this.projectId != other.projectId ||
          this.credentials != other.credentials ||
          this.location != other.location ||
          this.orgId != other.orgId
      case _ => true
    }
  }
}

/**
  * class for ssh tunnel configuration using public key
  */
case class SshConfig(
    host: String,
    port: Int,
    username: String,
    publicKey: String,
    @Min(0) timeoutMs: Int = 60000,
    @Min(0) aliveIntervalMs: Int = 120000
)
