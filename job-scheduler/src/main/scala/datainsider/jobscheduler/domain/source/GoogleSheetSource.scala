package datainsider.jobscheduler.domain.source

import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.jobscheduler.domain.DataSourceType.DataSourceType
import datainsider.jobscheduler.domain.Ids.{OrgId, SourceId}
import datainsider.jobscheduler.domain.{DataSource, DataSourceType}

case class GoogleSheetSource(
    orgId: OrgId,
    creatorId: String = "",
    @NotEmpty displayName: String,
    @NotEmpty accessToken: String,
    @NotEmpty refreshToken: String,
    id: SourceId,
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {
  override def getId: SourceId = id

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = lastModify

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.GoogleSheet

  override def getConfig: Map[String, Any] = Map("access_token" -> accessToken, "refresh_token" -> refreshToken)
}
