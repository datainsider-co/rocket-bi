package datainsider.jobscheduler.domain.source

import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finatra.validation.constraints.NotEmpty
import datainsider.jobscheduler.domain.DataSourceType.DataSourceType
import datainsider.jobscheduler.domain.Ids.SourceId
import datainsider.jobscheduler.domain.source.TrackingSourceType.TrackingSourceType
import datainsider.jobscheduler.domain.{DataSource, DataSourceType}
import datainsider.jobscheduler.util.JsonUtils

case class TrackingSource(
    orgId: Long,
    id: SourceId,
    @NotEmpty displayName: String,
    @NotEmpty apiKey: String,
    @JsonScalaEnumeration(classOf[TrackingSourceTypeRef]) sourceType: TrackingSourceType,
    creatorId: String,
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.TrackingSource

  override def getConfig: Map[String, Any] = Map("api_key" -> apiKey, "source_type" -> sourceType.toString)

  override def getCreatorId: String = creatorId

  override def getLastModify: SourceId = this.lastModify
}

object TrackingSourceType extends Enumeration {
  type TrackingSourceType = Value
  val JsSource: TrackingSourceType = Value("JsSource")
}

class TrackingSourceTypeRef extends TypeReference[TrackingSourceType.type]
