package datainsider.jobscheduler.domain.source

import datainsider.jobscheduler.domain.DataSourceType.DataSourceType
import datainsider.jobscheduler.domain.Ids.SourceId
import datainsider.jobscheduler.domain.{DataSource, DataSourceType}

case class FacebookAdsSource(
    orgId: Long,
    id: SourceId,
    displayName: String,
    accessToken: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.FaceBookAdsSource

  override def getConfig: Map[String, Any] =
    Map(
      "access_token" -> accessToken
    )

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify
}
