package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId

case class GoogleServiceAccountSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    credential: String
) extends DataSource {
  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.GoogleTokenCredential

  override def getConfig: Map[String, Any] =
    Map(
      "credential" -> credential
    )
}
