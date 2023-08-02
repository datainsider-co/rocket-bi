package co.datainsider.jobworker.service.hubspot

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.source.HubspotSource
import co.datainsider.jobworker.domain.{HubspotJob, HubspotProgress, JobProgress, JobStatus}
import co.datainsider.jobworker.hubspot.deal.{Deal, DealPipeline, DealStage}
import co.datainsider.jobworker.hubspot.property.HsPropertyInfo
import co.datainsider.jobworker.hubspot.service.DealService
import co.datainsider.jobworker.service.worker.DepotAssistant.ColumnBuilder
import co.datainsider.jobworker.service.worker.{JobWorker, SingleDepotAssistant}
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.client.SchemaClientService

import scala.util.control.NonFatal

/**
  * Created by phg on 7/5/21.
  */
case class DealWorker(source: HubspotSource, schemaService: SchemaClientService, engine: Engine[Connection], connection: Connection)
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
          val pipelineDepot = SingleDepotAssistant(schemaService, dealPipelineSchema, engine, connection)
          val stageDepot = SingleDepotAssistant(schemaService, dealStageSchema, engine, connection)
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
          val depotAssistant = SingleDepotAssistant(schemaService, dealSchema, engine, connection)
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
    Array(
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
    Array(
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
    Array(
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
