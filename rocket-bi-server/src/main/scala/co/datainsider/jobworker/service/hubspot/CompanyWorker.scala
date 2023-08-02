package co.datainsider.jobworker.service.hubspot

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.source.HubspotSource
import co.datainsider.jobworker.domain.{HubspotJob, HubspotProgress, JobProgress, JobStatus}
import co.datainsider.jobworker.hubspot.company.Company
import co.datainsider.jobworker.hubspot.property.HsPropertyInfo
import co.datainsider.jobworker.hubspot.service.CompanyService
import co.datainsider.jobworker.service.worker.DepotAssistant.ColumnBuilder
import co.datainsider.jobworker.service.worker.{JobWorker, SingleDepotAssistant}
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.client.SchemaClientService

/**
  * Created by phg on 6/28/21.
  */
case class CompanyWorker(source: HubspotSource, schemaService: SchemaClientService, engine: Engine[Connection], connection: Connection)
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
        val depotAssistant = SingleDepotAssistant(schemaService, destTableSchema, engine, connection)
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
    Array(
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
