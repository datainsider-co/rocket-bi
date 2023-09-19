package co.datainsider.bi.module

import co.datainsider.bi.client.{HikariClient, JdbcClient}
import co.datainsider.bi.domain.response.ChartResponse
import co.datainsider.bi.domain.{BigQueryConnection, ClickhouseConnection}
import co.datainsider.bi.engine.bigquery.BigQueryEngine
import co.datainsider.bi.engine.clickhouse.ClickhouseEngine
import co.datainsider.bi.engine.factory.{EngineResolver, EngineResolverImpl}
import co.datainsider.bi.engine.mysql.{MySqlEngine, MysqlConnection}
import co.datainsider.bi.engine.posgresql.{PostgreSqlConnection, PostgreSqlEngine}
import co.datainsider.bi.engine.redshift.{RedshiftConnection, RedshiftEngine}
import co.datainsider.bi.engine.vertica.{VerticaConnection, VerticaEngine}
import co.datainsider.bi.engine.{ClientManager, Engine}
import co.datainsider.bi.repository._
import co.datainsider.bi.service._
import co.datainsider.bi.util.{Using, ZConfig}
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.share.service.{PermissionAssigner, PermissionAssignerImpl}
import com.google.inject.name.Named
import com.google.inject.{Inject, Provides, Singleton}
import com.twitter.inject.TwitterModule
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.SSDBs
import org.nutz.ssdb4j.spi.SSDB
import org.quartz.impl.StdSchedulerFactory

import java.util.Properties

/**
  * Created by SangDang on 9/16/16.
  */
object BIServiceModule extends TwitterModule {

  override def configure: Unit = {
    bind[QueryExecutor].to[QueryExecutorImpl].asEagerSingleton()
    bind[QueryService].to[QueryServiceImpl].asEagerSingleton()
    bind[DashboardService].to[DashboardServiceImpl].asEagerSingleton()
    bind[DirectoryService].to[DirectoryServiceImpl].asEagerSingleton()
    bind[GeolocationService].to[GeolocationServiceImpl].asEagerSingleton()
    bind[DeletedDirectoryService].to[DeletedDirectoryServiceImpl].asEagerSingleton()
    bind[StarredDirectoryService].to[StarredDirectoryServiceImpl].asEagerSingleton()
    bind[RecentDirectoryService].to[RecentDirectoryServiceImpl].asEagerSingleton()
    bind[DrillThroughService].to[DashboardFieldServiceImpl].asEagerSingleton()
    bind[RelationshipService].to[RelationshipServiceImpl].asEagerSingleton()
    bind[RlsPolicyService].to[RlsPolicyServiceImpl].asEagerSingleton()
    bind[UserActivityService].to[UserActivityServiceImpl].asEagerSingleton()
    bind[AdminService].to[AdminServiceImpl].asEagerSingleton()
    bind[PermissionAssigner].to[PermissionAssignerImpl].asEagerSingleton()
    bind[ConnectionService].to[ConnectionServiceImpl].asEagerSingleton()
  }

  @Provides
  @Singleton
  def providesClientPool(): ClientManager = {
    new ClientManager(maxClientSize = ZConfig.getInt("client_clientManager.size", 100))
  }

  @Provides
  @Singleton
  def providesClickhouseEngine(clientManager: ClientManager): Engine[ClickhouseConnection] = {
    new ClickhouseEngine(
      clientManager = clientManager,
      maxQueryRows = ZConfig.getInt("clickhouse_engine.max_query_rows", 10000),
      connTimeoutMs = ZConfig.getInt("clickhouse_engine.conn_timeout_ms", 30000) // 30 second
    )
  }

  @Provides
  @Singleton
  def providesBigqueryEngine(clientManager: ClientManager): Engine[BigQueryConnection] = {
    new BigQueryEngine(
      clientManager = clientManager,
      maxQueryRows = ZConfig.getInt("bigquery_engine.max_query_rows", 10000),
      defaultTimeoutMs = ZConfig.getInt("bigquery_engine.conn_timeout_ms", 30000)
    )
  }

  @Provides
  @Singleton
  def providesMysqlSource(clientManager: ClientManager): Engine[MysqlConnection] = {
    new MySqlEngine(
      clientManager = clientManager,
      maxQueryRows = ZConfig.getInt("mysql_engine.max_query_rows", 10000),
      poolSize = ZConfig.getInt("mysql_engine.client_size", 10),
      timeoutMs = ZConfig.getInt("mysql_engine.timeout_ms", 30000),
      insertBatchSize = ZConfig.getInt("mysql_engine.insert_batch_size", 100000)
    )
  }

  @Provides
  @Singleton
  def providesVerticaEngine(clientManager: ClientManager): Engine[VerticaConnection] = {
    new VerticaEngine(
      clientManager = clientManager,
      clientSize = ZConfig.getInt("vertica_engine.client_size", 10),
      timeoutMs = ZConfig.getInt("vertica_engine.timeout_ms", 30000),
      insertBatchSize = ZConfig.getInt("vertica_engine.insert_batch_size", 100000)
    )
  }

  @Provides
  @Singleton
  def providesPostgreSqlEngine(clientManager: ClientManager): Engine[PostgreSqlConnection] = {
    new PostgreSqlEngine(
      client = clientManager,
      poolSize = ZConfig.getInt("postgres_engine.client_pool_size", 10),
      timeoutMs = ZConfig.getInt("postgres_engine.conn_timeout_ms", 30000),
      maxQueryRows = ZConfig.getInt("postgres_engine.max_query_rows", 10000)
    )
  }

  @Provides
  @Singleton
  def providesRedshiftEngine(clientManager: ClientManager): Engine[RedshiftConnection] = {
    new RedshiftEngine(
      clientManager = clientManager,
      poolSize = ZConfig.getInt("redshift_engine.client_pool_size", 10),
      timeoutMs = ZConfig.getInt("redshift_engine.conn_timeout_ms", 30000),
      maxQueryRows = ZConfig.getInt("redshift_engine.max_query_rows", 10000)
    )
  }

  @Provides
  @Singleton
  def providesEngineResolver(
      clickhouseEngine: Engine[ClickhouseConnection],
      bigqueryEngine: Engine[BigQueryConnection],
      mysqlEngine: Engine[MysqlConnection],
      verticaEngine: Engine[VerticaConnection],
      postgreSqlEngine: Engine[PostgreSqlConnection],
      redshiftEngine: Engine[RedshiftConnection]
  ): EngineResolver = {
    val resolver: EngineResolver = new EngineResolverImpl()
    resolver
      .register(clickhouseEngine)
      .register(bigqueryEngine)
      .register(mysqlEngine)
      .register(verticaEngine)
      .register(postgreSqlEngine)
      .register(redshiftEngine)
    return resolver
  }

  @Provides
  @Singleton
  @Named("mysql")
  def provideJdbcClient(): JdbcClient = {
    val jdbcUrl: String = ZConfig.getString("database.mysql.url")
    val user: String = ZConfig.getString("database.mysql.user")
    val password: String = ZConfig.getString("database.mysql.password")
    val clientManagerSize: Int = Math.min(Runtime.getRuntime.availableProcessors() * 2, 20)
    val client = HikariClient(jdbcUrl, user, password, Some(clientManagerSize))
    Using(client.getConnection())(_ => Unit)
    client
  }

  val dbLiveName: String = ZConfig.getString("database_schema.database.name")
  val dbTestName: String = ZConfig.getString("database_schema_testing.database.name")

  val tblDirectoryName: String = ZConfig.getString("database_schema.table.directory.name")
  val tblDashboardName: String = ZConfig.getString("database_schema.table.dashboard.name")
  val tblPermissionTokenName: String = ZConfig.getString("database_schema.table.permission_token.name")
  val tblObjectSharingTokenName: String = ZConfig.getString("database_schema.table.object_sharing_token.name")
  val tblGeolocation: String = ZConfig.getString("database_schema.table.geolocation.name")
  val tblShareInfoName: String = ZConfig.getString("database_schema.table.share_info.name")
  val tblDeletedDirectoryName: String = ZConfig.getString("database_schema.table.deleted_directory.name")
  val tblStarredDirectoryName: String = ZConfig.getString("database_schema.table.starred_directory.name")
  val tblRecentDirectoryName: String = ZConfig.getString("database_schema.table.recent_directory.name")
  val tblDashboardFieldName: String = ZConfig.getString("database_schema.table.dashboard_field.name")
  val tblRlsPolicyName: String = ZConfig.getString("database_schema.table.rls_policy.name")
  val tblConnectionName: String = ZConfig.getString("database_schema.table.connection.name", "connection")

  @Provides
  @Singleton
  def provideMySqlDashboardRepository(@Named("mysql") client: JdbcClient): DashboardRepository = {
    new MySqlDashboardRepository(
      client,
      dbLiveName,
      tblDashboardName,
      tblDirectoryName,
      tblShareInfoName,
      tblDashboardFieldName
    )
  }

  @Singleton
  @Provides
  def provideMySqlDirectoryRepository(@Named("mysql") client: JdbcClient): DirectoryRepository = {
    new MySqlDirectoryRepository(client, dbLiveName, tblDirectoryName)
  }

  @Singleton
  @Provides
  def provideMySqlDeletedDirectoryRepository(@Named("mysql") client: JdbcClient): DeletedDirectoryRepository = {
    new MysqlDeletedDirectoryRepository(client, dbLiveName, tblDeletedDirectoryName)
  }

  @Singleton
  @Provides
  def provideMySqlGeolocationRepository(): GeolocationRepository = {
    val dataPath = ZConfig.getString("geolocation.data_path", "mapdata")
    new InMemGeolocationRepository(dataPath)
  }

  @Singleton
  @Provides
  def provideMySqlStarredDirectoryRepository(@Named("mysql") client: JdbcClient): StarredDirectoryRepository = {
    new MysqlStarredDirectoryRepository(client, dbLiveName, tblStarredDirectoryName)
  }

  @Singleton
  @Provides
  def provideMySqlRecentDirectoryRepository(@Named("mysql") client: JdbcClient): RecentDirectoryRepository = {
    new MsqlRecentDirectoryRepository(client, dbLiveName, tblRecentDirectoryName)
  }

  @Singleton
  @Provides
  def provideSchemaManager(@Inject @Named("mysql") client: JdbcClient): SchemaManager = {
    val biServiceSchemaManager = new BIServiceSchemaManager(client, dbLiveName)
    biServiceSchemaManager.ensureSchema().syncGet()
    biServiceSchemaManager
  }

  @Singleton
  @Provides
  def provideMySqlDrillThroughFieldRepository(
      @Inject @Named("mysql") client: JdbcClient
  ): DrillThroughFieldRepository = {
    new DashboardFieldRepositoryImpl(client, dbLiveName, tblDashboardFieldName)
  }

  @Singleton
  @Provides
  def providesSSDB(): SSDB = {
    SSDBs.pool(
      ZConfig.getString("ssdb.config.host"),
      ZConfig.getInt("ssdb.config.port"),
      ZConfig.getInt("ssdb.config.timeout_in_ms"),
      null
    )
  }

  @Singleton
  @Provides
  @Named("root_dir")
  def providerUserIdRootMapping(ssdb: SSDB): SsdbKVS[String, Long] = {
    val userRootDirSsdb = ZConfig.getString("directory.user_root_dir")
    SsdbKVS[String, Long](userRootDirSsdb, ssdb)
  }

  @Singleton
  @Provides
  @Named("token_header_key")
  def providerTokenKey(): String = "Token-Id"

  @Singleton
  @Provides
  def provideChartResponseRepository(
      @Inject ssdb: SSDB,
      @Inject queryService: QueryService
  ): ChartResponseRepository = {
    val kvs = SsdbKVS[String, ChartResponse](s"chart_responses_test", ssdb)
    new ChartResponseRepositoryImpl(queryService, kvs)
  }

  @Singleton
  @Provides
  def provideBoostScheduleService(
      @Inject chartResponseRepository: ChartResponseRepository,
      @Inject dashboardService: DashboardService
  ): BoostScheduleService = {

    val props = new Properties()
    props.setProperty("org.quartz.threadPool.threadCount", ZConfig.getString("boost_scheduler.num_worker_threads", "1"))

    val boostJobFactory = new CustomJobFactory(dashboardService, chartResponseRepository)
    val scheduler = new StdSchedulerFactory(props).getScheduler()
    scheduler.setJobFactory(boostJobFactory)

    new BoostScheduleServiceImpl(scheduler, dashboardService)
  }

  @Singleton
  @Provides
  @Named("boosted")
  def provideBoostScheduleService(
      @Inject chartResponseRepository: ChartResponseRepository,
      @Inject queryService: QueryService
  ): QueryService = {
    new BoostedQueryService(queryService, chartResponseRepository)
  }

  @Singleton
  @Provides
  def provideRelationshipRepository(ssdb: SSDB): RelationshipRepository = {
    val kvs = SsdbKVS[String, String]("di_relationships", ssdb)
    new SsdbRelationshipRepository(kvs)
  }

  @Singleton
  @Provides
  def provideRlsPolicyRepository(@Named("mysql") client: JdbcClient): RlsPolicyRepository = {
    new MysqlRlsPolicyRepository(client, dbLiveName, tblRlsPolicyName)
  }

  @Singleton
  @Provides
  def provideConnectionRepository(@Named("mysql") client: JdbcClient): ConnectionRepository = {
    val mySqlConnRepository = new MySqlConnectionRepository(client, dbLiveName, tblConnectionName)
    val cachedConnRepository = new CachedConnectionRepository(mySqlConnRepository)
    cachedConnRepository
  }

  @Singleton
  @Provides
  def provideUserActivityRepository(@Named("mysql") client: JdbcClient): UserActivityRepository = {
    val userActivityRepository = MySqlUserActivityRepository(client, dbLiveName, "user_activities")
    userActivityRepository.ensureSchema()
    userActivityRepository
  }

  @Singleton
  @Provides
  def providesSshRepository(@Named("mysql") client: JdbcClient): SshKeyRepository = {
    val repository = SshKeyRepositoryImpl(client, dbLiveName, "sshkey")
    repository.ensureSchema()
    repository
  }

  @Singleton
  @Provides
  def providesSshKeyService(sshRepository: SshKeyRepository): SshKeyService = {
    val sshKeyService = new SshServiceImpl(sshRepository)
    CacheSshService(sshKeyService)
  }

}
