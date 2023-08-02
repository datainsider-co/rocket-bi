package co.datainsider.jobworker.service.hubspot

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain._
import co.datainsider.jobworker.domain.source.HubspotSource
import co.datainsider.jobworker.service.worker.JobWorker
import co.datainsider.schema.client.SchemaClientService
import com.twitter.util.Future

/**
  * Created by phg on 7/10/21.
  */
case class HubspotWorker(
    source: HubspotSource,
    schemaService: SchemaClientService,
    engine: Engine[Connection],
    connection: Connection
) extends JobWorker[HubspotJob] {

  private val contactWorker = ContactWorker(source, schemaService, engine, connection)
  private val dealWorker = DealWorker(source, schemaService, engine, connection)
  private val engagementWorker = EngagementWorker(source, schemaService, engine, connection)
  private val companyWorker = CompanyWorker(source, schemaService, engine, connection)

  override def run(job: HubspotJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    job.subType match {
      case HubspotSubJobType.Contact    => contactWorker.run(job, syncId, onProgress)
      case HubspotSubJobType.Deal       => dealWorker.run(job, syncId, onProgress)
      case HubspotSubJobType.Engagement => engagementWorker.run(job, syncId, onProgress)
      case HubspotSubJobType.Company    => companyWorker.run(job, syncId, onProgress)
      case _ =>
        HubspotProgress(
          orgId = job.orgId,
          syncId = syncId,
          jobId = job.jobId,
          updatedTime = System.currentTimeMillis(),
          jobStatus = JobStatus.Terminated,
          totalSyncRecord = 0,
          totalExecutionTime = 0,
          message = Some("unknown subtype")
        )
    }
  }
}
