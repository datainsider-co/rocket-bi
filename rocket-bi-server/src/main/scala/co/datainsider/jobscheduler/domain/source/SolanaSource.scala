package co.datainsider.jobscheduler.domain.source

import co.datainsider.jobscheduler.domain.Ids.SourceId
import co.datainsider.jobscheduler.domain.source.DataSourceType.DataSourceType

case class SolanaSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    entrypoint: String,
    creatorId: String = "",
    lastModify: Long = System.currentTimeMillis()
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Solana

  override def getConfig: Map[String, Any] = Map("entrypoint" -> entrypoint)

  override def getCreatorId: String = creatorId

  override def getLastModify: Long = lastModify
}
