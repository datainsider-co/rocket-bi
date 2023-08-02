package co.datainsider.jobworker.service.worker

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.domain.DataDestination.DataDestination
import co.datainsider.jobworker.domain.Ids.SyncId
import co.datainsider.jobworker.domain.JobStatus.JobStatus
import co.datainsider.jobworker.domain.job.CoinMarketCapJob
import co.datainsider.jobworker.domain.{CoinMarketCapProgress, DataDestination, JobProgress, JobStatus}
import co.datainsider.jobworker.hubspot.util.JsonUtil.JsonNodeLike
import co.datainsider.jobworker.repository.writer.DataWriter
import co.datainsider.jobworker.repository.{CoinMarketCapClientImpl, CoinMarketCapListResponse}
import co.datainsider.jobworker.service.worker.CoinMarketCapWorker.COLUMN_NAME_TO_PATH_MAP
import co.datainsider.jobworker.util.Implicits.FutureEnhance
import co.datainsider.jobworker.util.StringUtils
import co.datainsider.schema.client.SchemaClientService
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column._
import com.fasterxml.jackson.databind.JsonNode
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import education.x.commons.KVS

import java.util.concurrent.atomic.AtomicBoolean
import scala.concurrent.ExecutionContext.Implicits.global

class CoinMarketCapWorker(
    schemaService: SchemaClientService,
    jobInQueue: KVS[Long, Boolean],
    querySize: Int = ZConfig.getInt("coin_market_cap.query_size", 1000),
    engine: Engine[Connection],
    connection: Connection
) extends JobWorker[CoinMarketCapJob]
    with Logging {

  val isRunning: AtomicBoolean = new AtomicBoolean(true)

  override def run(job: CoinMarketCapJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    logger.info(s"${Thread.currentThread().getName}: begin job: $job")
    try {
      return sync(job, syncId, onProgress)
    } catch {
      case ex: Throwable => {
        error(s"execute job fail: $job", ex)
        return CoinMarketCapProgress(
          job.orgId,
          syncId,
          job.jobId,
          System.currentTimeMillis(),
          JobStatus.Error,
          0,
          0,
          "",
          Some(ex.getMessage)
        )
      }
    } finally {
      jobInQueue.remove(syncId)
      info(s"${Thread.currentThread().getName}: finish job: $job")
    }
  }

  private def sync(job: CoinMarketCapJob, syncId: SyncId, onProgress: JobProgress => Future[Unit]): JobProgress = {
    val beginTime: Long = System.currentTimeMillis()
    val jobProgress = CoinMarketCapProgress(
      job.orgId,
      syncId,
      job.jobId,
      System.currentTimeMillis(),
      JobStatus.Syncing,
      0,
      System.currentTimeMillis() - beginTime
    )
    onProgress(jobProgress)

    val tableSchema: TableSchema =
      CoinMarketCapWorker.getCoinTableSchema(job.orgId, job.destDatabaseName, job.destTableName)
    lazy val writers: Seq[DataWriter] = Seq(engine.createWriter(connection))

    schemaService.createOrMergeTableSchema(tableSchema).sync()

    var rowInserted: Long = 0

    def reportStatus(): Unit = {
      // report sync status to job-scheduler
      val newProgress: JobProgress = jobProgress.copy(
        updatedTime = System.currentTimeMillis(),
        totalSyncRecord = rowInserted,
        totalExecutionTime = System.currentTimeMillis() - beginTime
      )
      onProgress(newProgress)

      // check terminate signal from job-scheduler
      jobInQueue.get(syncId).map {
        case Some(value) => isRunning.set(value)
        case None        =>
      }
    }

    val client = new CoinMarketCapClientImpl(job.apiKey)
    var hasNext = true
    var from = 0
    while (hasNext && isRunning.get()) {
      val response: CoinMarketCapListResponse[JsonNode] = client.listLatestCrypto(from, querySize)
      val records: Seq[Record] =
        CoinMarketCapWorker.toRecords(tableSchema.columns, response.data, COLUMN_NAME_TO_PATH_MAP)
      if (records.nonEmpty) {
        writers.foreach(_.write(records, tableSchema))
        rowInserted = rowInserted + records.length
        from += records.length
        reportStatus()
      } else {
        hasNext = false
      }
    }

    writers.foreach(_.close())

    val finalStatus: JobStatus =
      if (isRunning.get()) {
        JobStatus.Synced
      } else {
        JobStatus.Terminated
      }

    jobProgress.copy(
      jobStatus = finalStatus,
      updatedTime = System.currentTimeMillis(),
      totalSyncRecord = rowInserted,
      totalExecutionTime = System.currentTimeMillis() - beginTime
    )
  }

}

object CoinMarketCapWorker {
  def toRecords(
      columns: Seq[Column],
      data: Seq[JsonNode],
      columnNameToPathMap: Map[String, String]
  ): Seq[Record] = {
    return data.map((node: JsonNode) => {
      columns
        .map(column => {
          val path: String = columnNameToPathMap(column.name)
          node.path(path)
          node.at(path).getValue(column)
        })
        .toArray
    })
  }

  def getCoinTableSchema(organizationId: Long, dbName: String, tblName: String): TableSchema = {
    new TableSchema(
      tblName,
      dbName,
      organizationId,
      StringUtils.getOriginTblName(tblName),
      columns = Seq(
        Int64Column("id", "id", Some("The unique ID for this cryptocurrency."), isNullable = false),
        StringColumn("name", "name", Some("The name of this cryptocurrency."), isNullable = false),
        StringColumn("symbol", "symbol", Some("The ticker symbol for this cryptocurrency."), isNullable = true),
        Int64Column("rank", "rank", isNullable = true),
        Int64Column(
          "num_market_pairs",
          "num_market_pairs",
          Some("The number of active trading pairs available for this cryptocurrency across supported exchanges."),
          isNullable = true
        ),
        DoubleColumn(
          "circulating_supply",
          "circulating_supply",
          Some("The approximate number of coins circulating for this cryptocurrency."),
          isNullable = true
        ),
        DoubleColumn(
          "total_supply",
          "total_supply",
          Some(
            "The approximate total amount of coins in existence right now (minus any coins that have been verifiably burned)."
          ),
          isNullable = true
        ),
        DoubleColumn(
          "market_cap_by_total_supply",
          "market_cap_by_total_supply",
          Some("The market cap by total supply."),
          isNullable = true
        ),
        DoubleColumn(
          "max_supply",
          "max_supply",
          Some("The expected maximum limit of coins ever to be available for this cryptocurrency."),
          isNullable = true
        ),
        DateTimeColumn("last_updated", "last_updated", isNullable = true),
        DateTimeColumn("date_added", "date_added", isNullable = true),
        StringColumn("tags", "tags", isNullable = true),
        DoubleColumn("self_reported_circulating_supply", "self_reported_circulating_supply", isNullable = true),
        DoubleColumn("self_reported_market_cap", "self_reported_market_cap", isNullable = true),
        Int64Column(
          "platform_id",
          "platform_id",
          Some("The unique CoinMarketCap ID for the parent platform cryptocurrency."),
          isNullable = true
        ),
        StringColumn(
          "platform_name",
          "platform_name",
          Some("The name of the parent platform cryptocurrency."),
          isNullable = true
        ),
        StringColumn(
          "platform_symbol",
          "platform_symbol",
          Some("The ticker symbol for the parent platform cryptocurrency."),
          isNullable = true
        ),
        StringColumn(
          "platform_slug",
          "platform_slug",
          Some("The web URL friendly shorthand version of the parent platform cryptocurrency name."),
          isNullable = true
        ),
        StringColumn(
          "token_address",
          "token_address",
          Some("The token address on the parent platform cryptocurrency."),
          isNullable = true
        ),
        DoubleColumn("price", "price", Some("Price in the specified currency for this historical."), isNullable = true),
        DoubleColumn(
          "volume_24h",
          "volume_24h",
          Some("Rolling 24 hour adjusted volume in the specified currency."),
          isNullable = true
        ),
        DoubleColumn(
          "volume_change_24h",
          "volume_change_24h",
          Some("24 hour change in the specified currencies volume."),
          isNullable = true
        ),
        DoubleColumn(
          "volume_24h_reported",
          "volume_24h_reported",
          Some("Rolling 24 hour reported volume in the specified currency."),
          isNullable = true
        ),
        DoubleColumn(
          "volume_7d",
          "volume_7d",
          Some("Rolling 7 day adjusted volume in the specified currency."),
          isNullable = true
        ),
        DoubleColumn(
          "volume_7d_reported",
          "volume_7d_reported",
          Some("Rolling 7 day reported volume in the specified currency."),
          isNullable = true
        ),
        DoubleColumn(
          "volume_30d",
          "volume_30d",
          Some("Rolling 30 day adjusted volume in the specified currency."),
          isNullable = true
        ),
        DoubleColumn(
          "volume_30d_reported",
          "volume_30d_reported",
          Some("Rolling 30 day reported volume in the specified currency."),
          isNullable = true
        ),
        DoubleColumn("market_cap", "market_cap", isNullable = true),
        DoubleColumn("market_cap_dominance", "market_cap_dominance", isNullable = true),
        DoubleColumn("fully_diluted_market_cap", "fully_diluted_market_cap", isNullable = true),
        DoubleColumn("percent_change_1h", "percent_change_1h", isNullable = true),
        DoubleColumn("percent_change_24h", "percent_change_24h", isNullable = true),
        DoubleColumn("percent_change_7d", "percent_change_7d", isNullable = true),
        DateTimeColumn("price_last_updated", "price_last_updated", isNullable = true)
      )
    )
  }

  val COLUMN_NAME_TO_PATH_MAP: Map[String, String] = Map(
    "id" -> "/id",
    "name" -> "/name",
    "symbol" -> "/symbol",
    "rank" -> "/cmc_rank",
    "num_market_pairs" -> "/num_market_pairs",
    "circulating_supply" -> "/circulating_supply",
    "total_supply" -> "/total_supply",
    "market_cap_by_total_supply" -> "/market_cap_by_total_supply",
    "max_supply" -> "/max_supply",
    "max_supply" -> "/max_supply",
    "last_updated" -> "/last_updated",
    "date_added" -> "/date_added",
    "tags" -> "/tags",
    "self_reported_circulating_supply" -> "/self_reported_circulating_supply",
    "self_reported_market_cap" -> "/self_reported_market_cap",
    "platform_id" -> "/platform/id",
    "platform_name" -> "/platform/name",
    "platform_name" -> "/platform/name",
    "platform_symbol" -> "/platform/symbol",
    "platform_slug" -> "/platform/slug",
    "token_address" -> "/platform/token_address",
    "token_address" -> "/platform/token_address",
    "price" -> "/quote/USD/price",
    "volume_24h" -> "/quote/USD/volume_24h",
    "volume_change_24h" -> "/quote/USD/volume_change_24h",
    "volume_24h_reported" -> "/quote/USD/volume_24h_reported",
    "volume_7d" -> "/quote/USD/volume_7d",
    "volume_7d_reported" -> "/quote/USD/volume_7d_reported",
    "volume_30d" -> "/quote/USD/volume_30d",
    "volume_30d_reported" -> "/quote/USD/volume_30d_reported",
    "market_cap" -> "/quote/USD/market_cap",
    "market_cap_dominance" -> "/quote/USD/market_cap_dominance",
    "fully_diluted_market_cap" -> "/quote/USD/fully_diluted_market_cap",
    "percent_change_1h" -> "/quote/USD/percent_change_1h",
    "percent_change_24h" -> "/quote/USD/percent_change_24h",
    "percent_change_7d" -> "/quote/USD/percent_change_7d",
    "price_last_updated" -> "/quote/USD/last_updated"
  )
}
