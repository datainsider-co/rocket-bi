package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType

case class GoogleServiceAccountSource(
    orgId: Long,
    id: SourceId,
    displayName: String,
    credential: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.GoogleServiceAccountCredential

  override def getConfig: Map[String, Any] =
    Map(
      "credential" -> credential
    )

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify
}
