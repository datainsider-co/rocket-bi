package co.datainsider.bi.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.response.ChartResponse
import co.datainsider.bi.domain.{BigQueryConnection, ClickhouseConnection}
import co.datainsider.bi.engine.bigquery.BigQueryEngine
import co.datainsider.bi.engine.clickhouse.ClickhouseEngine
import co.datainsider.bi.engine.factory.{EngineResolver, EngineResolverImpl}
import co.datainsider.bi.engine.{ClientManager, Engine}
import co.datainsider.bi.module.BIServiceModule.{bind, _}
import co.datainsider.bi.repository._
import co.datainsider.bi.service._
import co.datainsider.bi.util.{Using, ZConfig}
import co.datainsider.caas.user_profile.client.{MockOrgAuthorizationClientServiceImpl, MockProfileClientServiceImpl}
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.share.service.{MockPermissionAssigner, MockShareService, PermissionAssigner}
import com.google.inject.name.Named
import com.google.inject.{Inject, Provides, Singleton}
import com.twitter.inject.TwitterModule
import datainsider.client.service.{MockSchemaClientService, SchemaClientService}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB
import org.quartz.impl.StdSchedulerFactory

import java.util.Properties
import scala.io.Source

object TestModule extends TwitterModule {

  override def configure: Unit = {
    bind[QueryService].to[QueryServiceImpl].asEagerSingleton()
    bind[QueryExecutor].to[QueryExecutorImpl].asEagerSingleton()
    bind[GeolocationService].to[GeolocationServiceImpl].asEagerSingleton()
    bind[DrillThroughService].to[DashboardFieldServiceImpl].asEagerSingleton()
    bind[RlsPolicyService].to[RlsPolicyServiceImpl].asEagerSingleton()
    bind[UserActivityService].to[UserActivityServiceImpl].asEagerSingleton()
    bind[SchemaClientService].to[MockSchemaClientService].asEagerSingleton()
    bind[AdminService].to[MockAdminService].asEagerSingleton()
    bind[StarredDirectoryService].to[StarredDirectoryServiceImpl].asEagerSingleton()
    bind[PermissionAssigner].to[MockPermissionAssigner].asEagerSingleton()
  }

  @Provides
  @Singleton
  def providesClientPool(): ClientManager = new ClientManager()

  @Provides
  @Singleton
  def providesClickhouseEngine(pool: ClientManager): Engine[ClickhouseConnection] = {
    new ClickhouseEngine(
      clientManager = pool,
      maxQueryRows = ZConfig.getInt("clickhouse_engine.max_query_rows", 10000),
      connTimeoutMs = ZConfig.getInt("clickhouse_engine.conn_timeout_ms", 30000) // 30 second
    )
  }

  @Provides
  @Singleton
  def providesBigqueryEngine(pool: ClientManager): Engine[BigQueryConnection] = {
    new BigQueryEngine(
      clientManager = pool,
      maxQueryRows = ZConfig.getInt("bigquery_engine.max_query_rows", 10000),
      defaultTimeoutMs = ZConfig.getInt("bigquery_engine.conn_timeout_ms", 30000)
    )
  }

  @Provides
  @Singleton
  def providesEngineResolver(
      clickhouseEngine: Engine[ClickhouseConnection],
      bigqueryEngine: Engine[BigQueryConnection]
  ): EngineResolver = {
    val resolver: EngineResolver = new EngineResolverImpl()
    resolver
      .register(clickhouseEngine)
      .register(bigqueryEngine)
    return resolver
  }

  @Provides
  @Singleton
  def provideMySqlDashboardRepository(@Inject @Named("mysql") client: JdbcClient): DashboardRepository = {
    new MySqlDashboardRepository(
      client,
      dbTestName,
      tblDashboardName,
      tblDirectoryName,
      tblShareInfoName,
      tblDashboardFieldName
    )
  }

  @Singleton
  @Provides
  def provideMySqlDirectoryRepository(@Inject @Named("mysql") client: JdbcClient): DirectoryRepository = {
    new MySqlDirectoryRepository(client, dbTestName, tblDirectoryName)
  }

  @Singleton
  @Provides
  def provideMySqlDeletedDirectoryRepository(@Inject @Named("mysql") client: JdbcClient): DeletedDirectoryRepository = {
    new MysqlDeletedDirectoryRepository(client, dbTestName, tblDeletedDirectoryName)
  }

  @Singleton
  @Provides
  def provideMySqlGeolocationRepository(@Named("mysql") client: JdbcClient): GeolocationRepository = {
    new MySqlGeolocationRepository(client, dbTestName, tblGeolocation)
  }

  @Singleton
  @Provides
  def provideMySqlStarredDirectoryRepository(@Named("mysql") client: JdbcClient): StarredDirectoryRepository = {
    new MysqlStarredDirectoryRepository(client, dbTestName, tblStarredDirectoryName)
  }

  @Singleton
  @Provides
  def provideMySqlRecentDirectoryRepository(@Named("mysql") client: JdbcClient): RecentDirectoryRepository = {
    new MsqlRecentDirectoryRepository(client, dbTestName, tblRecentDirectoryName)
  }

  @Singleton
  @Provides
  def provideSchemaManager(@Inject @Named("mysql") client: JdbcClient): SchemaManager = {
    val mySqlSchemaManager = new BIServiceSchemaManager(client, dbTestName)
    mySqlSchemaManager.ensureSchema().syncGet()
    mySqlSchemaManager
  }

  @Singleton
  @Provides
  def provideMySqlDrillThroughFieldRepository(
      @Inject @Named("mysql") client: JdbcClient
  ): DrillThroughFieldRepository = {
    new DashboardFieldRepositoryImpl(client, dbTestName, tblDashboardFieldName)
  }

  @Singleton
  @Provides
  def provideChartResponseRepository(@Inject ssdb: SSDB): ChartResponseRepository = {
    val queryService = new MockQueryService()
    val kvs = SsdbKVS[String, ChartResponse](s"chart_responses_test", ssdb)
    new ChartResponseRepositoryImpl(queryService, kvs)
  }

  @Singleton
  @Provides
  def provideBoostWorker(@Inject chartResponseRepository: ChartResponseRepository): BoostJob = {
    val mockDashboardService = new MockDashboardService
    new BoostJob(mockDashboardService, chartResponseRepository)
  }

  @Singleton
  @Provides
  def provideBoostScheduleService(@Inject chartResponseRepository: ChartResponseRepository): BoostScheduleService = {
    val mockDashboardService = new MockDashboardService

    val props = new Properties();
    props.setProperty("org.quartz.threadPool.threadCount", ZConfig.getString("boost_scheduler.num_worker_thread", "1"))

    val boostJobFactory = new CustomJobFactory(mockDashboardService, chartResponseRepository)
    val scheduler = new StdSchedulerFactory(props).getScheduler()
    scheduler.setJobFactory(boostJobFactory)

    new BoostScheduleServiceImpl(scheduler, mockDashboardService)
  }

  @Singleton
  @Provides
  def provideRelationshipRepository(ssdb: SSDB): RelationshipRepository = {
    val kvs = SsdbKVS[String, String]("di_relationships_test", ssdb)
    new SsdbRelationshipRepository(kvs)
  }

  @Singleton
  @Provides
  def provideRelationshipService(relationshipRepository: RelationshipRepository): RelationshipService = {
    new RelationshipServiceImpl(relationshipRepository, new MockDashboardService)
  }

  @Singleton
  @Provides
  def provideRlsPolicyRepository(@Named("mysql") client: JdbcClient): RlsPolicyRepository = {
    new MysqlRlsPolicyRepository(client, dbTestName, tblRlsPolicyName)
  }

  @Singleton
  @Provides
  def providesDeletedDirectoryService(
      directoryRepository: DirectoryRepository,
      dashboardRepository: DashboardRepository,
      trashDirectoryRepository: DeletedDirectoryRepository,
      starredDirectoryService: StarredDirectoryService
  ): DeletedDirectoryService = {
    new DeletedDirectoryServiceImpl(
      directoryRepository,
      dashboardRepository,
      trashDirectoryRepository,
      starredDirectoryService = starredDirectoryService,
      shareService = new MockShareService(),
      orgAuthorizationClient = new MockOrgAuthorizationClientServiceImpl()
    )
  }

  @Singleton
  @Provides
  @Named("root_dir")
  def providerUserIdRootMapping(ssdb: SSDB): SsdbKVS[String, Long] = {
    val userRootDirSsdb = ZConfig.getString("directory.user_root_dir", "test_root_dir")
    SsdbKVS[String, Long](userRootDirSsdb, ssdb)
  }

  @Singleton
  @Provides
  def providesDirectoryService(
      directoryRepository: DirectoryRepository,
      dashboardRepository: DashboardRepository,
      @Named("root_dir") rootDirKvs: SsdbKVS[String, Long],
      deletedDirectoryService: DeletedDirectoryService,
      permissionAssigner: PermissionAssigner
  ): DirectoryService = {
    new DirectoryServiceImpl(
      directoryRepository,
      dashboardRepository,
      new MockProfileClientServiceImpl(),
      new MockShareService(),
      rootDirKvs,
      deletedDirectoryService,
      permissionAssigner
    )
  }

  @Singleton
  @Provides
  def provideConnectionRepository(@Named("mysql") client: JdbcClient): ConnectionRepository = {
    val mySqlConnRepository = new MySqlConnectionRepository(client, dbTestName, tblConnectionName)
    val cachedConnRepository = new CachedConnectionRepository(mySqlConnRepository)
    cachedConnRepository
  }

  @Singleton
  @Provides
  def provideUserActivityRepository(@Named("mysql") client: JdbcClient): UserActivityRepository = {
    val userActivityRepository = MySqlUserActivityRepository(client, dbTestName, "user_activities")
    userActivityRepository.ensureSchema().syncGet()
    userActivityRepository
  }

  @Singleton
  @Provides
  def providesSshRepository(@Named("mysql") client: JdbcClient): SshKeyRepository = {
    val repository = SshKeyRepositoryImpl(client, dbTestName, "sshkey")
    repository.ensureSchema().syncGet()
    repository
  }

  @Provides
  @Singleton
  def providesBigQuerySource(): BigQueryConnection = {
    val credentials = Using(
      Source.fromInputStream(getClass.getClassLoader.getResourceAsStream("credentials/bigquery-dev.json"))
    )(_.mkString)
    BigQueryConnection(
      orgId = 2,
      projectId = "di-insider",
      credentials = credentials,
      location = None
    )
  }

  @Singleton
  @Provides
  def providesSshKeyService(sshRepository: SshKeyRepository): SshKeyService = {
    val sshKeyService = new SshServiceImpl(sshRepository)
    CacheSshService(sshKeyService)
  }
}
