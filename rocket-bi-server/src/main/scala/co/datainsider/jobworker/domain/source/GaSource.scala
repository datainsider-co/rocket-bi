package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId

case class GaSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis(),
    accessToken: String,
    refreshToken: String
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Ga

  override def getConfig: Map[String, Any] =
    Map(
      "access_token" -> accessToken,
      "refresh_token" -> refreshToken
    )
}
