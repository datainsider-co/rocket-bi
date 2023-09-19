package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType

case class GoogleSearchConsoleSource(
    orgId: Long,
    id: SourceId,
    displayName: String,
    refreshToken: String,
    accessToken: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.GoogleSearchConsole

  override def getConfig: Map[String, Any] = Map(
    "access_token" -> accessToken,
    "refresh_token" -> refreshToken,
  )

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify
}
