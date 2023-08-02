package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.SourceId

case class SolanaSource(
    orgId: Long = -1,
    id: SourceId,
    displayName: String,
    entrypoint: String
) extends DataSource {

  override def getId: SourceId = id

  override def getName: String = displayName

  override def getType: DataSourceType = DataSourceType.Solana

  override def getConfig: Map[String, Any] = Map()
}
