package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType

case class HubspotSource(
    orgId: Long,
    id: SourceId,
    displayName: String,
    apiKey: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Hubspot

  override def getConfig: Map[String, Any] = Map(
    "api_key" -> apiKey
  )

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify
}
