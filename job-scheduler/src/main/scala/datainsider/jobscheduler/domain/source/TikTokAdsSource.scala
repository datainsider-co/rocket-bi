package datainsider.jobscheduler.domain.source

import datainsider.client.domain.scheduler.Ids.SourceId
import datainsider.jobscheduler.domain.{DataSource, DataSourceType}
import datainsider.jobscheduler.domain.DataSourceType.DataSourceType
import datainsider.jobscheduler.domain.Ids.OrgId

case class TikTokAdsSource(
    id: SourceId,
    orgId: OrgId,
    creatorId: String = "",
    displayName: String,
    accessToken: String,
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.TikTokAdsSource

  override def getConfig: Map[String, Any] =
    Map(
      "access_token" -> accessToken
    )

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify
}
