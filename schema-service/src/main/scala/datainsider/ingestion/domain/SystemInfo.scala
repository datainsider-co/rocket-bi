package datainsider.ingestion.domain

import datainsider.ingestion.domain.RefreshBy.RefreshBy
import datainsider.ingestion.domain.RefreshStatus.RefreshStatus
import datainsider.ingestion.domain.SystemStatus.SystemStatus
import education.x.commons.Serializer
import org.apache.commons.lang3.SerializationUtils

/**
  * created 2022-07-19 4:45 PM
  *
  * @author tvc12 - Thien Vi
  */
@SerialVersionUID(20220719L)
case class SystemInfo(
    orgId: Long,
    status: SystemStatus,
    sources: Seq[ClickhouseSource],
    refreshConfig: RefreshConfig,
    currentRefreshStatus: RefreshStatus = RefreshStatus.Init,
    lastRefreshStatus: Option[RefreshStatus] = None,
    lastRefreshTime: Option[Long] = None,
    lastRefreshBy: Option[RefreshBy] = None,
    lastRefreshErrorMsg: Option[String] = None,
    createdTime: Long = System.currentTimeMillis(),
    updatedTime: Long = System.currentTimeMillis()
)

object SystemInfo {
  def default(orgId: Long): SystemInfo = {
    SystemInfo(
      orgId,
      SystemStatus.Healthy,
      sources = Seq.empty,
      refreshConfig = RefreshConfig(
        ignoredEngines = Seq.empty
      )
    )
  }

  implicit object SystemInfoSerializer extends Serializer[SystemInfo] {

    override def fromByte(bytes: Array[Byte]): SystemInfo = {
      SerializationUtils.deserialize(bytes).asInstanceOf[SystemInfo]
    }

    override def toByte(value: SystemInfo): Array[Byte] = {
      SerializationUtils.serialize(value)
    }
  }
}

object SystemStatus {
  type SystemStatus = String

  val Healthy = "healthy"
  val Unhealthy = "unhealthy"
}

object RefreshStatus {
  type RefreshStatus = String

  val Init = "init"
  val Running = "running"
  val Error = "error"
  val Success = "success"
}

object RefreshBy {
  type RefreshBy = String

  val Manual = "manual"
  val System = "system"
}
