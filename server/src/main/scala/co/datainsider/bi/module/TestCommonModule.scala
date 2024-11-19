package co.datainsider.bi.module

import co.datainsider.bi.client.BIClientService
import co.datainsider.bi.domain.{BigQueryConnection, ClickhouseConnection}
import co.datainsider.bi.engine.bigquery.BigQueryEngineFactory
import co.datainsider.bi.engine.clickhouse.ClickhouseEngineFactory
import co.datainsider.bi.engine.factory.{EngineFactory, EngineFactoryProvider}
import co.datainsider.bi.engine.mysql.{MysqlConnection, MysqlEngineFactory}
import co.datainsider.bi.engine.posgresql.{PostgreSqlConnection, PostgreSqlEngineFactory}
import co.datainsider.bi.engine.redshift.{RedshiftConnection, RedshiftEngineFactory}
import co.datainsider.bi.engine.vertica.{VerticaConnection, VerticaEngineFactory}
import co.datainsider.bi.service._
import co.datainsider.bi.util.ZConfig
import co.datainsider.common.client.domain.kvs.{ExpiredKVS, SsdbExpiredKVS}
import co.datainsider.schema.service.{JobStatusService, JobStatusServiceImpl}
import com.google.inject.name.Named
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

/**
  * created 2023-12-11 1:23 PM
  *
  * @author tvc12 - Thien Vi
  */
object TestCommonModule extends TwitterModule {

  override protected def configure(): Unit = {
    super.configure()
    bind[QueryExecutor].to[QueryExecutorImpl].asEagerSingleton()
  }

  @Provides
  @Singleton
  def providesTunnelService(biClientService: BIClientService): TunnelService = {
    new TunnelServiceImpl(
      biClientService,
      maxSessionSize = ZConfig.getInt("engine_manager.max_tunnel_size", 200)
    )
  }

  @Provides
  @Singleton
  def providesEngineService(biClientService: BIClientService, tunnelService: TunnelService): EngineService = {
    val provider: EngineFactoryProvider = EngineFactoryProvider()
    provider
      .register(createClickhouseEngineFactory())
      .register(createBigqueryEngineFactory())
      .register(createMysqlSourceFactory())
      .register(createVerticaEngineFactory())
      .register(createRedshiftEngineFactory())
      .register(createPostgreSqlEngineFactory())
    new EngineServiceImpl(
      biClientService = biClientService,
      tunnelService = tunnelService,
      factoryProvider = provider,
      maxEngineSize = ZConfig.getInt("engine_manager.max_size", 100),
      expiredAfterAccessMs = ZConfig.getLong("engine_manager.expired_time_ms", 3600000) // 1 hour
    )
  }

  private def createClickhouseEngineFactory(): EngineFactory[ClickhouseConnection] = {
    new ClickhouseEngineFactory(
      poolSize = ZConfig.getInt("clickhouse_engine.client_pool_size", 10),
      maxQueryRows = ZConfig.getInt("clickhouse_engine.max_query_rows", 10000),
      testConnTimeoutMs = ZConfig.getInt("clickhouse_engine.test_conn_timeout_ms", 30000), // 30 second
      defaultProperties = ZConfig.getStringMap("clickhouse_engine.default_properties", Map.empty)
    )
  }

  private def createBigqueryEngineFactory(): EngineFactory[BigQueryConnection] = {
    new BigQueryEngineFactory(
      maxQueryRows = ZConfig.getInt("bigquery_engine.max_query_rows", 10000),
      defaultTimeoutMs = ZConfig.getInt("bigquery_engine.conn_timeout_ms", 30000),
      testConnTimeoutMs = ZConfig.getInt("bigquery_engine.test_conn_timeout_ms", 30000)
    )
  }

  private def createMysqlSourceFactory(): EngineFactory[MysqlConnection] = {
    new MysqlEngineFactory(
      poolSize = ZConfig.getInt("mysql_engine.client_pool_size", 10),
      testConnTimeoutMs = ZConfig.getInt("mysql_engine.test_conn_timeout_ms", 30000),
      insertBatchSize = ZConfig.getInt("mysql_engine.insert_batch_size", 100000),
      defaultProperties = ZConfig.getStringMap("mysql_engine.default_properties", Map.empty)
    )
  }

  private def createVerticaEngineFactory(): EngineFactory[VerticaConnection] = {
    new VerticaEngineFactory(
      poolSize = ZConfig.getInt("vertica_engine.client_pool_size", 10),
      testConnTimeoutMs = ZConfig.getInt("vertica_engine.test_conn_timeout_ms", 30000),
      insertBatchSize = ZConfig.getInt("vertica_engine.insert_batch_size", 100000),
      defaultProperties = ZConfig.getStringMap("vertica_engine.default_properties", Map.empty)
    )
  }

  private def createPostgreSqlEngineFactory(): EngineFactory[PostgreSqlConnection] = {
    new PostgreSqlEngineFactory(
      poolSize = ZConfig.getInt("postgres_engine.client_pool_size", 10),
      testConnTimeoutMs = ZConfig.getInt("postgres_engine.test_conn_timeout_ms", 30000),
      defaultProperties = ZConfig.getStringMap("postgres_engine.default_properties", Map.empty)
    )
  }

  private def createRedshiftEngineFactory(): EngineFactory[RedshiftConnection] = {
    new RedshiftEngineFactory(
      poolSize = ZConfig.getInt("redshift_engine.client_pool_size", 10),
      testConnTimeoutMs = ZConfig.getInt("redshift_engine.test_conn_timeout_ms", 30000),
      defaultProperties = ZConfig.getStringMap("redshift_engine.default_properties", Map.empty)
    )
  }

  @Singleton
  @Provides
  @Named("access-token")
  def providesAccessToken(): String = {
    ZConfig.getString("schedule_service.access_token", "job$cheduler@datainsider.co")
  }

  @Singleton
  @Provides
  def providesJobStatusService(client: SSDB): JobStatusService = {
    val databaseName: String = "test_job_status_db"
    new JobStatusServiceImpl(SsdbKVS[Long, Boolean]("test_job_status_db", client))
  }

  @Singleton
  @Provides
  @Named("locking_table_map")
  def providesLockingTableMap(client: SSDB): ExpiredKVS[String, Boolean] = {
    val dbName = "test_sync_locking_db"
    val naxItemSize = 5000
    val defaultExpiredTimeMs = 300000 // 5 minutes
    new SsdbExpiredKVS[String, Boolean](
      ssdb = client,
      dbName = dbName,
      maxItemSize = naxItemSize,
      defaultExpiredTimeMs = defaultExpiredTimeMs
    )
  }

  @Singleton
  @Provides
  @Named("datacook_status_service")
  def providesDataCookJobStatusService(client: SSDB): JobStatusService = {
    val databaseName: String = "test_datacook_job_status"
    new JobStatusServiceImpl(SsdbKVS[Long, Boolean](databaseName, client))
  }

  @Singleton
  @Provides
  @Named("datacook-cleanup-db")
  def providesCleanupDb(client: SSDB): ExpiredKVS[String, Boolean] = {
    val databaseName: String = "test_datacook_status_db"
    val maxItemSize = 5000
    val defaultExpiredTimeMs = 600000 // 10 minutes
    SsdbExpiredKVS(client, databaseName, maxItemSize, defaultExpiredTimeMs)
  }

  @Singleton
  @Provides
  @Named("versioning-cleanup-db")
  def providesVersioningCleanupDb(client: SSDB): ExpiredKVS[String, Boolean] = {
    val databaseName: String = "versioning_status_db"
    val maxItemSize = 5000
    val defaultExpiredTimeMs = 600000 // 10 minutes
    SsdbExpiredKVS(client, databaseName, maxItemSize, defaultExpiredTimeMs)
  }
}
