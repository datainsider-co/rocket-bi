package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType

case class GoogleAdsSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis(),
    refreshToken: String
) extends DataSource {
  override def getId: SourceId = id

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.GoogleAds

  override def getConfig: Map[String, Any] = Map("refresh_token" -> refreshToken)
}
