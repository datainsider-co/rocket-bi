package datainsider.jobworker.service.hubspot

import com.ptl.hubspot.engagement.Engagement
import com.ptl.hubspot.service.EngagementService
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.client.service.SchemaClientService
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.domain._
import datainsider.jobworker.service.worker.DepotAssistant.ColumnBuilder
import datainsider.jobworker.service.worker.{DepotAssistant, JobWorker, SingleDepotAssistant}

import scala.util.control.NonFatal

/**
  * Created by phg on 7/5/21.
 **/
case class EngagementWorker(
    source: HubspotSource,
    destinationSource: JdbcSource,
    schemaService: SchemaClientService
) extends JobWorker[HubspotJob]
    with Logging {

  private val engagementService = EngagementService(source.apiKey)

  override def run(job: HubspotJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    var totalRecords = 0L
    val begin = System.currentTimeMillis()

    def process(status: JobStatus, msg: Option[String] = None): HubspotProgress = {
      HubspotProgress(
        orgId = job.orgId,
        syncId = syncId,
        jobId = job.jobId,
        updatedTime = System.currentTimeMillis(),
        jobStatus = status,
        totalSyncRecord = totalRecords,
        totalExecutionTime = System.currentTimeMillis() - begin,
        message = msg
      )
    }

    try {
      val depotAssistant = SingleDepotAssistant(destinationSource, schemaService, engagementSchema)
      engagementService.fetchRecent(job.lastSuccessfulSync)(
        records => {
          depotAssistant.put(records.map(serializeEngagement))
          totalRecords += records.length
          onProgress(process(JobStatus.Syncing, Some(s"received ${records.length} records")))
        },
        err => onProgress(process(JobStatus.Error, Some(err)))
      )

      process(JobStatus.Synced)
    } catch {
      case NonFatal(throwable) =>
        error(throwable)
        process(JobStatus.Error, Some(throwable.getLocalizedMessage))
    }
  }

  private def serializeEngagement(a: Engagement): Record =
    Seq(
      a.engagement.portalId,
      a.engagement.id,
      a.engagement.active,
      a.engagement.createdAt,
      a.engagement.lastUpdated,
      a.engagement.createdBy,
      a.engagement.modifiedBy,
      a.engagement.ownerId,
      a.engagement.`type`,
      a.engagement.timestamp,
      a.associations.contactIds,
      a.associations.companyIds,
      a.associations.dealIds,
      a.associations.ownerIds,
      a.associations.workflowIds
    )

  private def engagementSchema: TableSchema =
    TableSchema(
      name = "engagement",
      dbName = "hubspot",
      organizationId = 1,
      displayName = "Engagement",
      columns = Seq(
        ColumnBuilder("portal_id").setDisplayName("Portal Id").UInt64.build(),
        ColumnBuilder("id").setDisplayName("Engagement Id").UInt64.build(),
        ColumnBuilder("active").setDisplayName("Added At").Boolean.build(),
        ColumnBuilder("created_at").setDisplayName("Created At").UInt64.build(),
        ColumnBuilder("last_updated").setDisplayName("Last Updated").UInt64.build(),
        ColumnBuilder("created_by").setDisplayName("Created By").String.build(),
        ColumnBuilder("modified_by").setDisplayName("Modified By").String.build(),
        ColumnBuilder("owner_id").setDisplayName("Owner Id").String.build(),
        ColumnBuilder("engagement_type").setDisplayName("Engagement Type").String.build(),
        ColumnBuilder("timestamp").setDisplayName("Timestamp").String.build(),
        ColumnBuilder("contact_ids").setDisplayName("Association Contacts").Array.build(),
        ColumnBuilder("company_ids").setDisplayName("Association Companies").Array.build(),
        ColumnBuilder("deals_ids").setDisplayName("Association Deals").Array.build(),
        ColumnBuilder("owner_ids").setDisplayName("Association Owners").Array.build(),
        ColumnBuilder("workflow_ids").setDisplayName("Association Workflow").Array.build()
      )
    )
}
