package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType
import co.datainsider.jobscheduler.domain.source.MixpanelRegion.MixpanelRegion
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
case class MixpanelSource(
    orgId: Long,
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

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify
}

object MixpanelRegion extends Enumeration {
  type MixpanelRegion = Value
  val US = Value("US")
  val EU = Value("EU")
}

class MixpanelRegionRef extends TypeReference[MixpanelRegion.type]
