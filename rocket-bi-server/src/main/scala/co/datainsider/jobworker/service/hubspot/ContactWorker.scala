package co.datainsider.jobworker.service.hubspot

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.source.HubspotSource
import co.datainsider.jobworker.domain.{HubspotJob, HubspotProgress, JobProgress, JobStatus}
import co.datainsider.jobworker.hubspot.contact.Contact
import co.datainsider.jobworker.hubspot.property.HsPropertyInfo
import co.datainsider.jobworker.hubspot.service.ContactService
import co.datainsider.jobworker.service.worker.DepotAssistant.ColumnBuilder
import co.datainsider.jobworker.service.worker.{DepotAssistant, JobWorker, SingleDepotAssistant}
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.client.SchemaClientService

import scala.util.control.NonFatal

/**
  * Created by phg on 7/5/21.
  */
case class ContactWorker(source: HubspotSource, schemaService: SchemaClientService, engine: Engine[Connection], connection: Connection)
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
          val depotAssistant: DepotAssistant = SingleDepotAssistant(schemaService, contactSchema, engine, connection)
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
    Array(
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
