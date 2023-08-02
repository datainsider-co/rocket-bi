package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.OrgId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType
import datainsider.client.domain.scheduler.Ids.SourceId

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
