package datainsider.jobworker.service.hubspot

import com.ptl.hubspot.company.Company
import com.ptl.hubspot.property.HsPropertyInfo
import com.ptl.hubspot.service.CompanyService
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

/**
  * Created by phg on 6/28/21.
 **/
case class CompanyWorker(source: HubspotSource, destinationSource: JdbcSource, schemaService: SchemaClientService)
    extends JobWorker[HubspotJob]
    with Logging {

  private val companyService = CompanyService(source.apiKey)

  private val dbName: String = "hubspot"

  private var companyProps: Seq[HsPropertyInfo] = Seq()

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

    companyService.fetchProperties(
      props => {
        companyProps = props
        val destTableSchema =
          companySchema.copy(dbName = job.destDatabaseName, name = job.destTableName, organizationId = job.orgId)
        val depotAssistant = SingleDepotAssistant(destinationSource, schemaService, destTableSchema)
        companyService.fetchRecent(job.lastSuccessfulSync)(
          records => {
            depotAssistant.put(records.map(serializeCompany))
            totalRecords += records.length
            onProgress(process(JobStatus.Syncing, Some(s"received ${records.length} records")))
          },
          err => onProgress(process(JobStatus.Error, Some(err)))
        )
      },
      err => onProgress(process(JobStatus.Error, Some(err)))
    )

    process(JobStatus.Synced)
  }

  /**
    * portalId: Long,
    * dealId: Long,
    * isDeleted: Boolean,
    * associations: Option[DealAssociation] = None,
    * properties: Map[String, DealProperties]
    */

  private def serializeCompany(a: Company): Record =
    Seq(
      a.portalId,
      a.companyId,
      a.isDeleted
    ) ++ companyProps.map(f => a.properties.getOrElse(f.name, null))

  private def companySchema: TableSchema =
    TableSchema(
      name = "company",
      dbName = dbName,
      organizationId = 1,
      displayName = "Company",
      columns = Seq(
        ColumnBuilder("portal_id").setDisplayName("Portal Id").UInt64.build(),
        ColumnBuilder("id").setDisplayName("Company Id").UInt64.build(),
        ColumnBuilder("is_deleted").setDisplayName("Is Deleted").Boolean.build()
      ) ++ companyProps.map(f => {
        ColumnBuilder(f.name).setDisplayName(f.label).build()
      })
    )

}
