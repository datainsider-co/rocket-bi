package co.datainsider.schema.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.service.ConnectionService
import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.user_profile.client.OrgClientService
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.schema.repository.{
  RefreshSchemaHistoryRepository,
  RefreshSchemaHistoryRepositoryImpl,
  SchemaMetadataStorage
}
import co.datainsider.schema.service.{
  RefreshSchemaService,
  RefreshSchemaServiceImpl,
  RefreshSchemaWorker,
  RefreshSchemaWorkerImpl
}
import com.google.inject.Provides
import com.google.inject.name.Named
import com.twitter.inject.TwitterModule

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
      engineResolver: EngineResolver,
      storage: SchemaMetadataStorage
  ): RefreshSchemaWorker = {
    new RefreshSchemaWorkerImpl(
      engineResolver = engineResolver,
      storage = storage,
      sleepWaitStopIntervalMs = ZConfig.getInt("db.clickhouse.sleep_wait_stop_interval_ms", 1000) // 1 seconds
    )
  }

  @Singleton
  @Provides
  def provideRefreshSchemaService(
      refreshSchemaWorker: RefreshSchemaWorker,
      orgClientService: OrgClientService,
      connectionService: ConnectionService,
      historyRepository: RefreshSchemaHistoryRepository
  ): RefreshSchemaService = {
    new RefreshSchemaServiceImpl(
      refreshSchemaWorker = refreshSchemaWorker,
      orgClientService = orgClientService,
      connectionService = connectionService,
      historyRepository = historyRepository,
      batchSize = 100,
      refreshIntervalMs = ZConfig.getInt("db.clickhouse.refresh_schema_interval_ms", 1800000), // 30 minutes
      waitStopTimeoutMs = ZConfig.getInt("db.clickhouse.wait_stop_timeout_ms", 30000) // 30 seconds
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
