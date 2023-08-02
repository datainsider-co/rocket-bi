package co.datainsider.jobworker.domain.response

import co.datainsider.bi.domain.Connection
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.{DataSource, Job}

case class NextJobResponse(hasJob: Boolean, data: Option[SyncInfo])

case class SyncInfo(syncId: SyncId, job: Job, source: Option[DataSource], connection: Connection) {
  override def toString: String = {
    s"""SyncInfo {
      |  syncId: $syncId
      |  job: $job
      |  source: $source
      |}
      |""".stripMargin
  }

  def getDebugData(): String = {
    s"""${job.getClass.getSimpleName}(orgId: ${job.orgId}, syncId: ${syncId}, jobId: ${job.jobId})"""
  }
}
