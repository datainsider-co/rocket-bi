package datainsider.jobworker.service.worker

import com.amazonaws.services.s3.AmazonS3
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.schema.TableSchema
import datainsider.client.domain.schema.column.Column
import datainsider.client.service.{HadoopFileClientService, LakeClientService, SchemaClientService}
import datainsider.jobworker.domain.Ids.SyncId
import datainsider.jobworker.domain._
import datainsider.jobworker.domain.job.GaJob
import datainsider.jobworker.domain.response.SyncInfo
import datainsider.jobworker.service.hubspot.HubspotWorker
import datainsider.jobworker.util.ZConfig
import education.x.commons.SsdbKVS

/**
  * @deprecated use JobWorker2 instead
  */
trait JobWorker[T <: Job] {
  def run(job: T, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress

  def mergeTableSchema(sourceTable: TableSchema, destTableOption: Option[TableSchema]): TableSchema = {
    destTableOption match {
      case None => sourceTable
      case Some(destTable) =>
        val newColumns: Seq[Column] = mergeColumns(sourceTable.columns, destTable.columns)
        destTable.copy(name = sourceTable.name, columns = newColumns)
    }
  }

  private def mergeColumns(sourceColumns: Seq[Column], destColumns: Seq[Column]): Seq[Column] = {
    val newColumns = sourceColumns.filter(sourceColumn => {
      !destColumns.exists(_.name.equals(sourceColumn.name))
    })
    destColumns ++ newColumns
  }
}

object JobWorker extends Logging {
  @throws[UnsupportedOperationException]
  def apply(
      syncInfo: SyncInfo,
      destinationSource: JdbcSource,
      reportProgress: JobProgress => Future[Unit],
      schemaService: SchemaClientService,
      lakeService: LakeClientService,
      ssdbKVS: SsdbKVS[Long, Boolean],
      hadoopFileClientService: HadoopFileClientService
  ): Runnable = {

    syncInfo.job match {
      case jdbcJob: JdbcJob =>
        () => {
          val worker = new JdbcWorker(
            syncInfo.source.get.asInstanceOf[JdbcSource],
            schemaService,
            ssdbKVS
          )
          jdbcJob.syncMode match {
            case SyncMode.FullSync =>
              val fullSyncWorker =
                new FullSyncWorker(schemaService, syncInfo.source, lakeService, ssdbKVS, hadoopFileClientService)
              val finished: JobProgress = fullSyncWorker.run(jdbcJob, syncInfo.syncId, reportProgress)
              reportProgress(finished)
            case SyncMode.IncrementalSync =>
              val incrementalSyncWorker = new JdbcIncrementalSyncWorker(destinationSource, worker)
              val finished: JobProgress = incrementalSyncWorker.run(jdbcJob, syncInfo.syncId, reportProgress)
              reportProgress(finished)
          }
        }
      case genericJdbcJob: GenericJdbcJob =>
        () => {
          val worker = new JdbcWorker(
            syncInfo.source.get.asInstanceOf[JdbcSource],
            schemaService,
            ssdbKVS
          )
          genericJdbcJob.syncMode match {
            case SyncMode.FullSync =>
              val fullSyncWorker =
                new FullSyncWorker(schemaService, syncInfo.source, lakeService, ssdbKVS, hadoopFileClientService)
              val finished: JobProgress = fullSyncWorker.run(genericJdbcJob, syncInfo.syncId, reportProgress)
              reportProgress(finished)
            case SyncMode.IncrementalSync =>
              val worker = new GenericJdbcWorker(syncInfo.source.get.asInstanceOf[JdbcSource], schemaService, ssdbKVS)
              val finished: JobProgress = worker.run(genericJdbcJob, syncInfo.syncId, reportProgress)
              reportProgress(finished)
          }
        }
      case job: BigQueryStorageJob =>
        () => {
          job.syncMode match {
            case SyncMode.FullSync =>
              val fullSyncWorker =
                new FullSyncWorker(schemaService, syncInfo.source, lakeService, ssdbKVS, hadoopFileClientService)
              val finished: JobProgress = fullSyncWorker.run(job, syncInfo.syncId, reportProgress)
              reportProgress(finished)
            case SyncMode.IncrementalSync =>
              val worker = new BigQueryStorageWorker(
                syncInfo.source.get.asInstanceOf[GoogleServiceAccountSource],
                schemaService,
                ssdbKVS
              )
              val rowRestrictions = if (job.lastSyncedValue.nonEmpty) {
                s"${job.incrementalColumn.get} > ${job.lastSyncedValue}"
              } else {
                ""
              }
              val finished: JobProgress =
                worker.run(job.copy(rowRestrictions = rowRestrictions), syncInfo.syncId, reportProgress)
              reportProgress(finished)
          }
        }
      case job: GaJob =>
        () => {
          job.syncMode match {
            case SyncMode.FullSync =>
              val fullSyncWorker =
                new FullSyncWorker(schemaService, syncInfo.source, lakeService, ssdbKVS, hadoopFileClientService)
              val finished: JobProgress = fullSyncWorker.run(job, syncInfo.syncId, reportProgress)
              reportProgress(finished)
            case SyncMode.IncrementalSync =>
              reportProgress(
                GaProgress(
                  job.orgId,
                  syncInfo.syncId,
                  job.jobId,
                  System.currentTimeMillis(),
                  JobStatus.Error,
                  0L,
                  0L,
                  Some("Unsupported incremental sync for google analytics")
                )
              )
          }
        }
      case job: HubspotJob =>
        () => {
          reportProgress {
            HubspotWorker(
              syncInfo.source.get.asInstanceOf[HubspotSource],
              destinationSource,
              schemaService
            ).run(job, syncInfo.syncId, reportProgress)
          }
        }
      case job: GoogleSheetJob =>
        () => {
          val fullSyncWorker =
            new FullSyncWorker(schemaService, syncInfo.source, lakeService, ssdbKVS, hadoopFileClientService)
          val finished: JobProgress = fullSyncWorker.run(job, syncInfo.syncId, reportProgress)
          reportProgress(finished)
        }
      case job: MongoJob =>
        () => {
          job.syncMode match {
            case SyncMode.FullSync =>
              val fullSyncWorker =
                new FullSyncWorker(schemaService, syncInfo.source, lakeService, ssdbKVS, hadoopFileClientService)
              val finished: JobProgress = fullSyncWorker.run(job, syncInfo.syncId, reportProgress)
              reportProgress(finished)
            case SyncMode.IncrementalSync =>
              val incrementalSyncWorker =
                new MongoWorker(syncInfo.source.get.asInstanceOf[MongoSource], schemaService, ssdbKVS)
              val finished = incrementalSyncWorker.run(job, syncInfo.syncId, reportProgress)
              reportProgress(finished)
          }
        }
      case job: SolanaJob =>
        () => {
          job.syncMode match {
            case SyncMode.IncrementalSync => {
              val maxQueueSize = ZConfig.getInt("solana.max_queue_size", 1000)
              val solanaWorker =
                new SolanaWorker(syncInfo.source.get.asInstanceOf[SolanaSource], schemaService, ssdbKVS, maxQueueSize)
              val finalProgress: JobProgress = solanaWorker.run(job, syncInfo.syncId, reportProgress)
              reportProgress(finalProgress)
            }
            case SyncMode.FullSync => {
              reportProgress(
                SolanaProgress(
                  job.orgId,
                  syncInfo.syncId,
                  job.jobId,
                  System.currentTimeMillis(),
                  JobStatus.Error,
                  0L,
                  0L,
                  "",
                  Some("Unsupported full sync in solana job")
                )
              )
            }
          }
        }
      case job: CoinMarketCapJob =>
        () => {
          job.syncMode match {
            case SyncMode.FullSync => {
              val fullSyncWorker =
                new FullSyncWorker(schemaService, syncInfo.source, lakeService, ssdbKVS, hadoopFileClientService)
              val finished: JobProgress = fullSyncWorker.run(job, syncInfo.syncId, reportProgress)
              reportProgress(finished)
            }
            case SyncMode.IncrementalSync => {
              reportProgress(
                CoinMarketCapProgress(
                  job.orgId,
                  syncInfo.syncId,
                  job.jobId,
                  System.currentTimeMillis(),
                  jobStatus = JobStatus.Error,
                  totalSyncRecord = 0L,
                  totalExecutionTime = 0L,
                  message = Some("CoinMarketCap unsupported incremental sync")
                )
              )
            }
          }
        }
      case job: AmazonS3Job =>
        () => {
          job.syncMode match {
            case SyncMode.FullSync =>
              val fullSyncWorker =
                new FullSyncWorker(schemaService, syncInfo.source, lakeService, ssdbKVS, hadoopFileClientService)
              val finished: JobProgress = fullSyncWorker.run(job, syncInfo.syncId, reportProgress)
              reportProgress(finished)
            case SyncMode.IncrementalSync =>
              val batchSize: Int = ZConfig.getInt("amazon_s3_worker.sync_batch_size", default = 1000)
              val connectionTimeout: Int = ZConfig.getInt("amazon_s3_worker.connection_timeout", default = 600000)
              val timeToLive: Long = ZConfig.getLong("amazon_s3_worker.time_to_live", default = 24 * 3600 * 1000)
              val amazonS3Source = syncInfo.source.get.asInstanceOf[AmazonS3Source]
              val s3Client: AmazonS3 = AmazonS3Client(amazonS3Source, connectionTimeout, timeToLive)
              val worker = new AmazonS3WorkerV2(
                source = amazonS3Source,
                schemaService = schemaService,
                ssdbKVS = ssdbKVS,
                s3Client = s3Client,
                batchSize = batchSize
              )
              val finished = worker.run(job, syncInfo.syncId, reportProgress)
              reportProgress(finished)
          }
        }
      case job: ShopifyJob =>
        () => {
          job.syncMode match {
            case SyncMode.FullSync =>
              val worker =
                new FullSyncWorker(schemaService, syncInfo.source, lakeService, ssdbKVS, hadoopFileClientService)
              val finished: JobProgress = worker.run(job, syncInfo.syncId, reportProgress)
              reportProgress(finished)
            case SyncMode.IncrementalSync => {
              val retryTimeoutMs = ZConfig.getInt("shopify.retry_time_out_ms", 30000)
              val minRetryTimeDelayMs = ZConfig.getInt("shopify.min_retry_time_delay_ms", 500)
              val maxRetryTimeDelayMs = ZConfig.getInt("shopify.max_retry_time_delay_ms", 1000)
              val worker = new ShopifyWorker(
                syncInfo.source.get.asInstanceOf[ShopifySource],
                schemaService,
                ssdbKVS,
                retryTimeoutMs,
                minRetryTimeDelayMs,
                maxRetryTimeDelayMs
              )
              val finished: JobProgress = worker.run(job, syncInfo.syncId, reportProgress)
              reportProgress(finished)
            }
          }
        }
      case googleAdsJob: GoogleAdsJob =>
        () => {
          googleAdsJob.syncMode match {
            case SyncMode.FullSync =>
              val fullSyncWorker =
                new FullSyncWorker(schemaService, syncInfo.source, lakeService, ssdbKVS, hadoopFileClientService)
              val finished: JobProgress = fullSyncWorker.run(googleAdsJob, syncInfo.syncId, reportProgress)
              reportProgress(finished)
            case SyncMode.IncrementalSync =>
              val batchSize: Int = ZConfig.getInt("google_ads_api.batch_size", default = 1000)
              val googleAdsSource = syncInfo.source.get.asInstanceOf[GoogleAdsSource]
              val incrementalSyncWorker =
                new GoogleAdsWorker(googleAdsSource, schemaService, ssdbKVS, batchSize)
              val finished = incrementalSyncWorker.run(googleAdsJob, syncInfo.syncId, reportProgress)
              reportProgress(finished)
          }
        }
      case other: Job =>
        logger.info(s"unsupported job: $other")
        throw new UnsupportedOperationException("unsupported job")
    }
  }
}
