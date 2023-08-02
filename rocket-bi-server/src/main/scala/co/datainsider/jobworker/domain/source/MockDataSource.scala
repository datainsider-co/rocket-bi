package co.datainsider.jobworker.domain.source

import co.datainsider.jobworker.domain.{DataSource, DataSourceType}
import co.datainsider.jobworker.domain.DataSourceType.DataSourceType
import co.datainsider.jobworker.domain.Ids.{DummyId, SourceId}

case class MockDataSource() extends DataSource {
  override def getId: SourceId = DummyId

  override def getName: String = "MockDataSource"

  override def getType: DataSourceType = DataSourceType.Other

  override def getConfig: Map[String, Any] = Map.empty
}
