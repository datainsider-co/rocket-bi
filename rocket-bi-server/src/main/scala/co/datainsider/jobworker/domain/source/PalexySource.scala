package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.{DataSource, DataSourceType}

case class PalexySource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    apiKey: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis(),
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Palexy

  override def getConfig: Map[String, Any] =
    Map(
      "api_key" -> apiKey
    )
}
