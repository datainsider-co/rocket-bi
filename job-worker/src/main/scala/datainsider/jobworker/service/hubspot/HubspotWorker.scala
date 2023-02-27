package datainsider.jobworker.service.hubspot

import com.twitter.util.Future
import datainsider.client.service.SchemaClientService
import datainsider.jobworker.domain.{
  HubspotJob,
  HubspotProgress,
  HubspotSource,
  HubspotSubJobType,
  JdbcSource,
  JobProgress,
  JobStatus
}
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.service.worker.JobWorker

/**
  * Created by phg on 7/10/21.
 **/
case class HubspotWorker(source: HubspotSource, destinationSource: JdbcSource, schemaService: SchemaClientService)
    extends JobWorker[HubspotJob] {

  private val contactWorker = ContactWorker(source, destinationSource, schemaService)
  private val dealWorker = DealWorker(source, destinationSource, schemaService)
  private val engagementWorker = EngagementWorker(source, destinationSource, schemaService)
  private val companyWorker = CompanyWorker(source, destinationSource, schemaService)

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
