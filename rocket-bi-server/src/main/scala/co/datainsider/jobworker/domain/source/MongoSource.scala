package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.{DataSource, DataSourceType, TLSConfiguration}

case class MongoSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    host: String,
    port: Option[String],
    username: String,
    password: String,
    tlsConfiguration: Option[TLSConfiguration],
    connectionUri: Option[String]
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.MongoDb

  override def getConfig: Map[String, Any] = Map()
}
