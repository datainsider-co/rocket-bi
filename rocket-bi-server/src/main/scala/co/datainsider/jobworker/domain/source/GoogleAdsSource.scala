package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId

case class GoogleAdsSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    refreshToken: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis(),
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.GoogleAds

  override def getConfig: Map[String, Any] = Map("refresh_token" -> refreshToken)
}
