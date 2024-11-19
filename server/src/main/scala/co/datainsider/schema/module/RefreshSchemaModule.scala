package co.datainsider.schema.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.service.EngineService
import co.datainsider.bi.util.Implicits.FutureEnhance
import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.user_profile.client.OrgClientService
import co.datainsider.common.client.domain.kvs.{ExpiredKVS, SsdbExpiredKVS}
import co.datainsider.schema.repository.{RefreshSchemaHistoryRepository, RefreshSchemaHistoryRepositoryImpl, SchemaMetadataStorage}
import co.datainsider.schema.service._
import com.google.inject.Provides
import com.google.inject.name.Named
import com.twitter.inject.TwitterModule
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.Singleton

/**
  * created 2022-07-21 9:55 PM
  *
  * @author tvc12 - Thien Vi
  */
object RefreshSchemaModule extends TwitterModule {

  @Singleton
  @Provides
  def providesRefreshSchemaWorker(
      engineService: EngineService,
      storage: SchemaMetadataStorage
  ): RefreshSchemaWorker = {
    new RefreshSchemaWorkerImpl(
      engineService = engineService,
      storage = storage,
      sleepWaitStopIntervalMs = ZConfig.getInt("db.clickhouse.sleep_wait_stop_interval_ms", 1000) // 1 seconds
    )
  }

  @Singleton
  @Provides
  def provideRefreshSchemaService(
      refreshSchemaWorker: RefreshSchemaWorker,
      orgClientService: OrgClientService,
      historyRepository: RefreshSchemaHistoryRepository,
      client: SSDB
  ): RefreshSchemaService = {
    val dbName = "refresh_schema_status_database"
    val db: ExpiredKVS[Long, Boolean] = SsdbExpiredKVS[Long, Boolean](
      ssdb = client,
      dbName = dbName,
      maxItemSize = 100,
      defaultExpiredTimeMs = 900000
    ) // 15 minutes
    new RefreshSchemaServiceImpl(
      refreshSchemaWorker = refreshSchemaWorker,
      orgClientService = orgClientService,
      historyRepository = historyRepository,
      refreshStatusService = new ExpiredStatusService(db),
      batchSize = 100,
      refreshIntervalMs = ZConfig.getInt("db.clickhouse.refresh_schema_interval_ms", 1800000) // 30 minutes
    )
  }

  @Singleton
  @Provides
  def provideRefreshSchemaHistoryRepository(@Named("mysql") client: JdbcClient): RefreshSchemaHistoryRepository = {
    val repository = new RefreshSchemaHistoryRepositoryImpl(client)
    repository.ensureSchema().syncGet()
    repository
  }
}
