package co.datainsider.bi.module

import co.datainsider.bi.client.{HikariClient, JdbcClient}
import co.datainsider.bi.domain.query.{QueryParser, QueryParserImpl}
import co.datainsider.bi.domain.response.ChartResponse
import co.datainsider.bi.domain.setting.ClickhouseConnectionSetting
import co.datainsider.bi.engine.clickhouse.DataTable
import co.datainsider.bi.engine.clickhouse.{ClickhouseEngine, ClickhouseParser}
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.repository._
import co.datainsider.bi.service._
import co.datainsider.bi.util.ZConfig
import com.google.inject.name.Named
import com.google.inject.{Inject, Provides, Singleton}
import com.twitter.inject.TwitterModule
import datainsider.client.util.JsonParser
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.SSDBs
import org.nutz.ssdb4j.spi.SSDB
import org.quartz.impl.StdSchedulerFactory

import java.util.Properties
import scala.io.{BufferedSource, Source}
import scala.util.Try

/**
  * Created by SangDang on 9/16/16.
  */
object BIServiceModule extends TwitterModule {

  override def configure: Unit = {
    bind[Engine[DataTable]].to[ClickhouseEngine].asEagerSingleton()
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
  }

  @Provides
  @Singleton
  def provideQueryParser(): QueryParser = {
    new QueryParserImpl(ClickhouseParser)
  }

  @Provides
  @Singleton
  @Named("clickhouse")
  def provideClickhouseClient(clickhouseConnSetting: Option[ClickhouseConnectionSetting]): JdbcClient = {
    if (clickhouseConnSetting.isDefined) {
      info(s"Read clickhouse connection setting from env: ${clickhouseConnSetting.get}")

      HikariClient(
        clickhouseConnSetting.get.toJdbcUrl,
        clickhouseConnSetting.get.username,
        clickhouseConnSetting.get.password
      )
    } else {
      val jdbcUrl: String = ZConfig.getString("database.clickhouse.url")
      info(s"Read clickhouse connection setting from file: $jdbcUrl")

      val user: String = ZConfig.getString("database.clickhouse.user")
      val password: String = ZConfig.getString("database.clickhouse.password")
      HikariClient(jdbcUrl, user, password)
    }

  }

  @Provides
  @Singleton
  def provideClickhouseConnectionSetting(): Option[ClickhouseConnectionSetting] = {
    Try {
      require(sys.env("CLICKHOUSE_HOST").nonEmpty, "clickhouse host can not be empty")

      ClickhouseConnectionSetting(
        host = sys.env("CLICKHOUSE_HOST"),
        httpPort = sys.env("CLICKHOUSE_HTTP_PORT").toInt,
        tcpPort = sys.env("CLICKHOUSE_TCP_PORT").toInt,
        username = sys.env("CLICKHOUSE_USERNAME"),
        password = sys.env("CLICKHOUSE_PASSWORD"),
        clusterName = sys.env.getOrElse("CLICKHOUSE_CLUSTER_NAME", "")
      )
    }.toOption
  }

  @Provides
  @Singleton
  @Named("mysql")
  def provideJdbcClient(): JdbcClient = {
    val jdbcUrl: String = ZConfig.getString("database.mysql.url")
    val user: String = ZConfig.getString("database.mysql.user")
    val password: String = ZConfig.getString("database.mysql.password")
    HikariClient(jdbcUrl, user, password)
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
  def provideMySqlGeolocationRepository(@Named("mysql") client: JdbcClient): GeolocationRepository = {
    new MySqlGeolocationRepository(client, dbLiveName, tblGeolocation)
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
    new MySqlSchemaManager(client, dbLiveName)
  }

  @Singleton
  @Provides
  def provideMySqlDrillThroughFieldRepository(@Inject @Named("mysql") client: JdbcClient): DrillThroughFieldRepository = {
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
  def providesUserActivityRepository(
      @Named("clickhouse") client: JdbcClient
  ): UserActivityRepository = {
    val dbName: String = ZConfig.getString("tracking_schema.user_activities.db_name", "di_system")
    val tblName: String = ZConfig.getString("tracking_schema.user_activities.tbl_name", "user_activities")
    new ClickhouseActivityRepository(client, dbName, tblName)
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
}
