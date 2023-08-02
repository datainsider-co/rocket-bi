package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.TLSConfiguration
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType
import co.datainsider.jobscheduler.util.JsonUtils

case class MongoSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    host: String,
    port: Option[String],
    username: String,
    password: String,
    tlsConfiguration: Option[TLSConfiguration] = None,
    connectionUri: Option[String] = None,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.MongoDb

  override def getConfig: Map[String, Any] =
    Map(
      "host" -> host,
      "port" -> port,
      "username" -> username,
      "password" -> password,
      "tls_configuration" -> JsonUtils.toJson(tlsConfiguration),
      "connection_uri" -> connectionUri
    )

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify
}
