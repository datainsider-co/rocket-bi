package co.datainsider.jobworker.domain.source

import co.datainsider.jobscheduler.domain.source.MixpanelRegion.MixpanelRegion
import co.datainsider.jobscheduler.domain.source.{MixpanelRegion, MixpanelRegionRef}
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId
import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration

case class MixpanelSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    accountUsername: String,
    accountSecret: String,
    projectId: String,
    @JsonScalaEnumeration(classOf[MixpanelRegionRef])
    region: MixpanelRegion = MixpanelRegion.US,
    timezone: String = "US/Pacific",
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Mixpanel

  override def getConfig: Map[String, Any] =
    Map(
      "account_username" -> accountUsername,
      "account_secret" -> accountSecret,
      "project_id" -> projectId,
      "region" -> region.toString,
      "timezone" -> timezone
    )
}
