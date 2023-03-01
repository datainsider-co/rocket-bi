package datainsider.jobworker.service.hubspot

import com.ptl.hubspot.deal.{Deal, DealPipeline, DealStage}
import com.ptl.hubspot.property.HsPropertyInfo
import com.ptl.hubspot.service.DealService
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.client.service.SchemaClientService
import datainsider.jobworker.client.JdbcClient.Record
import datainsider.jobworker.domain.{HubspotJob, HubspotProgress, HubspotSource, JdbcSource, JobProgress, JobStatus}
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain.JobStatus.JobStatus
import datainsider.jobworker.service.worker.DepotAssistant.ColumnBuilder
import datainsider.jobworker.service.worker.{DepotAssistant, JobWorker, SingleDepotAssistant}

import scala.util.control.NonFatal

/**
  * Created by phg on 7/5/21.
 **/
case class DealWorker(source: HubspotSource, destinationSource: JdbcSource, schemaService: SchemaClientService)
    extends JobWorker[HubspotJob]
    with Logging {

  private val dealService = DealService(source.apiKey)

  private var dealProps: Seq[HsPropertyInfo] = Seq()

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
      dealService.fetchAllDealPipeline(
        pipelines => {
          val pipelineDepot = SingleDepotAssistant(destinationSource, schemaService, dealPipelineSchema)
          val stageDepot = SingleDepotAssistant(destinationSource, schemaService, dealStageSchema)
          pipelineDepot.put(pipelines.map(serializeDealPipeline))
          pipelines.foreach(pipeline => {
            stageDepot.put(pipeline.stages.map(stage => serializeDealStage(stage, pipeline)))
          })
          totalRecords += pipelines.length + pipelines.map(_.stages.length).sum
        },
        err => onProgress(process(JobStatus.Error, Some(err)))
      )

      dealService.fetchProperties(
        props => {
          dealProps = props
          val depotAssistant = SingleDepotAssistant(destinationSource, schemaService, dealSchema)
          dealService.fetchRecent(job.lastSuccessfulSync)(
            records => {
              depotAssistant.put(records.map(serializeDeal))
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

  private def serializeDeal(a: Deal): Record = {
    Seq(
      a.portalId,
      a.dealId,
      a.isDeleted
    ) ++ dealProps.map(f => a.properties.getOrElse(f.name, null))
  }

  private def dealSchema: TableSchema =
    TableSchema(
      name = "deal",
      dbName = "hubspot",
      organizationId = 1,
      displayName = "Deal",
      columns = Seq(
        ColumnBuilder("portal_id").setDisplayName("Portal Id").UInt64.build(),
        ColumnBuilder("id").setDisplayName("Deal Id").UInt64.build(),
        ColumnBuilder("added_at").setDisplayName("Added At").UInt64.build()
      ) ++ dealProps.map(f => {
        ColumnBuilder(f.name).setDisplayName(f.label).build()
      })
    )

  private def serializeDealPipeline(a: DealPipeline): Record = {
    Seq(
      a.pipelineId,
      a.label,
      a.displayOrder,
      a.active
    )
  }

  private def dealPipelineSchema: TableSchema =
    TableSchema(
      name = "deal_pipeline",
      dbName = "hubspot",
      organizationId = 1,
      displayName = "Deal Pipeline",
      columns = Seq(
        ColumnBuilder("id").setDisplayName("Deal Pipeline Id").String.build(),
        ColumnBuilder("label").setDisplayName("Label").String.build(),
        ColumnBuilder("display_order").setDisplayName("Display Order").Int.build(),
        ColumnBuilder("active").setDisplayName("Active").Boolean.build()
      )
    )

  private def serializeDealStage(a: DealStage, p: DealPipeline): Record = {
    Seq(
      a.stageId,
      p.pipelineId,
      a.label,
      a.probability,
      a.active,
      a.closedWon
    )
  }

  private def dealStageSchema: TableSchema =
    TableSchema(
      name = "deal_stage",
      dbName = "hubspot",
      organizationId = 1,
      displayName = "Deal Stage",
      columns = Seq(
        ColumnBuilder("id").setDisplayName("Deal Stage Id").String.build(),
        ColumnBuilder("pipeline_id").setDisplayName("Deal Pipeline Id").String.build(),
        ColumnBuilder("label").setDisplayName("Label").String.build(),
        ColumnBuilder("probability").setDisplayName("Probability").Double.build(),
        ColumnBuilder("active").setDisplayName("Active").Boolean.build(),
        ColumnBuilder("closedWon").setDisplayName("Closed Won").Boolean.build()
      )
    )

}
