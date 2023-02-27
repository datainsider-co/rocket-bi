package datainsider.jobscheduler.domain.source

import datainsider.jobscheduler.domain.{DataSource, DataSourceType}
import datainsider.jobscheduler.domain.DataSourceType.DataSourceType
import datainsider.jobscheduler.domain.Ids.SourceId

case class Ga4Source(
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

  override def getType: DataSourceType = DataSourceType.Ga4

  override def getConfig: Map[String, Any] =
    Map(
      "access_token" -> accessToken,
      "refresh_token" -> refreshToken,
    )

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify
}
