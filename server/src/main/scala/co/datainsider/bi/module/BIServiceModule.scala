package co.datainsider.bi.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.domain.response.ChartResponse
import co.datainsider.bi.repository._
import co.datainsider.bi.service._
import co.datainsider.bi.util.Implicits.FutureEnhance
import co.datainsider.bi.util.ZConfig
import co.datainsider.common.client.domain.kvs.SSDBCache
import co.datainsider.common.client.domain.kvs.Serializer.{JsonSerializer, LongSerializer}
import co.datainsider.share.service.{PermissionAssigner, PermissionAssignerImpl}
import com.google.inject.name.Named
import com.google.inject.{Inject, Provides, Singleton}
import com.twitter.inject.TwitterModule
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

/**
  * Created by SangDang on 9/16/16.
  */
object BIServiceModule extends TwitterModule {

  override def configure: Unit = {
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
//    bind[TemplateDashboardService].to[TemplateDashboardServiceImpl].asEagerSingleton()
    bind[BoostScheduleService].to[MockBoostScheduleService].asEagerSingleton()
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
    new ConnectionRepositoryImpl(client, dbLiveName, tblConnectionName)
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
  def providesSshKeyService(sshRepository: SshKeyRepository): KeyPairService = {
    val sshKeyService = new KeyPairServiceImpl(sshRepository)
    CacheKeyPairService(sshKeyService)
  }

//  @Singleton
//  @Provides
//  def providesTemplateDashboardRepository(@Named("mysql") client: JdbcClient): TemplateDashboardRepository = {
//    val repository = new TemplateDashboardRepositoryImpl(client, dbLiveName, "template_dashboard")
//    repository.ensureSchema()
//    repository
//  }

  @Singleton
  @Provides
  def providesConnectionService(
      connectionRepository: ConnectionRepository,
      client: SSDB
  ): ConnectionService = {
    val dbName = "connection_cache_db"
    val connectionService = new ConnectionServiceImpl(connectionRepository)
    val cache = SSDBCache[Long, Connection](client, dbName)(LongSerializer, new JsonSerializer[Connection])
    CacheConnectionService(originService = connectionService, cache = cache)
  }

}
