package co.datainsider.jobworker.service.hubspot

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.source.HubspotSource
import co.datainsider.jobworker.domain.{HubspotJob, HubspotProgress, JobProgress, JobStatus}
import co.datainsider.jobworker.service.hubspot.client.HubspotReader
import co.datainsider.jobworker.service.worker.{JobWorker, MultiDepotAssistant}
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.TableSchema
import com.twitter.inject.Logging
import com.twitter.util.Future

import scala.util.control.NonFatal

/**
  * Created by phg on 7/5/21.
  */
case class HubspotWorker(
    source: HubspotSource,
    schemaService: SchemaClientService,
    engine: Engine[Connection],
    connection: Connection
) extends JobWorker[HubspotJob]
    with Logging {

  override def run(job: HubspotJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    val reader = new HubspotReader(source.apiKey, job)
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
    val schema: TableSchema = reader.getSchema
    val depotAssistant: MultiDepotAssistant = MultiDepotAssistant(schemaService, schema, Seq(engine), Seq(connection))

    try {
      do {
        try {
          val records: Seq[Record] = reader.next(schema.columns)
          depotAssistant.put(records)
          totalRecords += records.length
          onProgress(process(JobStatus.Syncing, Some(s"received ${records.length} records")))
        } catch {
          case e: Throwable => error(e)
        }
      } while (reader.hasNext())

      process(JobStatus.Synced)
    } catch {
      case NonFatal(throwable) =>
        error(throwable)
        process(JobStatus.Error, Some(throwable.getLocalizedMessage))
    } finally {
      depotAssistant.close()
    }
  }

}
