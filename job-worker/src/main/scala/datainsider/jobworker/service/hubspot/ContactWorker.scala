package datainsider.jobworker.service.hubspot

import com.ptl.hubspot.contact.Contact
import com.ptl.hubspot.property.HsPropertyInfo
import com.ptl.hubspot.service.ContactService
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
case class ContactWorker(source: HubspotSource, destinationSource: JdbcSource, schemaService: SchemaClientService)
    extends JobWorker[HubspotJob]
    with Logging {

  private val contactService = ContactService(source.apiKey)
  private var contactProps: Seq[HsPropertyInfo] = Seq()

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
      contactService.fetchProperties(
        props => {
          contactProps = props
          val depotAssistant: DepotAssistant = SingleDepotAssistant(destinationSource, schemaService, contactSchema)
          contactService.fetchRecent(job.lastSuccessfulSync)(
            records => {
              depotAssistant.put(records.map(serializeContact))
              totalRecords += records.length
              onProgress(process(JobStatus.Syncing, Some(s"received ${records.length} records")))
            },
            err => onProgress(process(JobStatus.Error, Some(err)))
          )
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

  private def serializeContact(a: Contact): Record = {
    Seq(
      a.portalId,
      a.vid,
      a.addedAt
    ) ++ contactProps.map(f => a.properties.getOrElse(f.name, null))
  }

  private def contactSchema: TableSchema =
    TableSchema(
      name = "contact",
      dbName = "hubspot",
      organizationId = 1,
      displayName = "Contact",
      columns = Seq(
        ColumnBuilder("portal_id").setDisplayName("Portal Id").UInt64.build(),
        ColumnBuilder("id").setDisplayName("Contact Id").UInt64.build(),
        ColumnBuilder("added_at").setDisplayName("Added At").UInt64.build()
      ) ++ contactProps.map(f => {
        ColumnBuilder(f.name).setDisplayName(f.label).build()
      })
    )
}
