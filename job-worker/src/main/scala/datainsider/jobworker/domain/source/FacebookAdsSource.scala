package datainsider.jobworker.domain.source

import datainsider.jobworker.domain.DataSourceType.DataSourceType
import datainsider.jobworker.domain.Ids.SourceId
import datainsider.jobworker.domain.{DataSource, DataSourceType}

case class FacebookAdsSource(id: SourceId, displayName: String, accessToken: String) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.FacebookAds

  override def getConfig: Map[String, Any] =
    Map(
      "access_token" -> accessToken
    )
}
