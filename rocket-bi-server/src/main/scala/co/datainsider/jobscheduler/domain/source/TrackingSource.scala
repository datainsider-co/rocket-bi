package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType
import co.datainsider.jobscheduler.domain.source.TrackingSourceType.TrackingSourceType
import com.fasterxml.jackson.core.`type`.TypeReference
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.finatra.validation.constraints.NotEmpty

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
