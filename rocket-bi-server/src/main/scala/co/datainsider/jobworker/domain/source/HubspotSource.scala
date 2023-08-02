package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId

case class HubspotSource(
    id: SourceId,
    displayName: String,
    apiKey: String
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Hubspot

  override def getConfig: Map[String, Any] = Map()
}
