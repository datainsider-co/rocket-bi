package co.datainsider.bi.engine.posgresql

import co.datainsider.bi.domain.Connection

case class PostgreSqlConnection(
    orgId: Long = -1,
    host: String,
    port: Int,
    username: String,
    password: String,
    database: String,
    properties: Map[String, String] = Map.empty,
    createdBy: String = null,
    updatedBy: String = null,
    createdAt: Long = System.currentTimeMillis(),
    updatedAt: Long = System.currentTimeMillis()
) extends Connection {

  def jdbcUrl: String = {
    s"jdbc:postgresql://$host:$port/$database"
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

    override def isDifferent(other: Connection): Boolean = {
        other match {
        case other: PostgreSqlConnection =>
            this.host != other.host ||
            this.port != other.port ||
            this.properties != other.properties ||
            this.database != other.database ||
            this.username != other.username ||
            this.password != other.password ||
            this.orgId != other.orgId
        case _ => true
        }
    }
}
