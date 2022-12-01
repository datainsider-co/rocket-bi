package co.datainsider.bi.module

import co.datainsider.bi.client.{HikariClient, JdbcClient, NativeJDbcClient}
import co.datainsider.bi.domain.query.{QueryParser, QueryParserImpl}
import co.datainsider.bi.domain.response.ChartResponse
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.clickhouse.{ClickhouseEngine, ClickhouseParser, DataTable}
import co.datainsider.bi.module.BIServiceModule.{
  dbTestName,
  tblDashboardFieldName,
  tblDashboardName,
  tblDeletedDirectoryName,
  tblDirectoryName,
  tblGeolocation,
  tblRecentDirectoryName,
  tblRlsPolicyName,
  tblShareInfoName,
  tblStarredDirectoryName
}
import co.datainsider.bi.repository.{
  ChartResponseRepository,
  ChartResponseRepositoryImpl,
  ClickhouseActivityRepository,
  DashboardFieldRepository,
  DashboardFieldRepositoryImpl,
  DashboardRepository,
  DeletedDirectoryRepository,
  DirectoryRepository,
  GeolocationRepository,
  MsqlRecentDirectoryRepository,
  MySqlDashboardRepository,
  MySqlDirectoryRepository,
  MySqlGeolocationRepository,
  MySqlSchemaManager,
  MysqlDeletedDirectoryRepository,
  MysqlRlsPolicyRepository,
  MysqlStarredDirectoryRepository,
  RecentDirectoryRepository,
  RelationshipRepository,
  RlsPolicyRepository,
  SchemaManager,
  SsdbRelationshipRepository,
  StarredDirectoryRepository,
  UserActivityRepository
}
import co.datainsider.bi.service.{
  BoostJob,
  BoostScheduleService,
  BoostScheduleServiceImpl,
  CustomJobFactory,
  DashboardFieldService,
  DashboardFieldServiceImpl,
  GeolocationService,
  GeolocationServiceImpl,
  MockDashboardService,
  MockQueryService,
  QueryExecutor,
  QueryExecutorImpl,
  QueryService,
  QueryServiceImpl,
  RelationshipService,
  RelationshipServiceImpl,
  RlsPolicyService,
  RlsPolicyServiceImpl,
  UserActivityService,
  UserActivityServiceImpl
}
import co.datainsider.bi.util.ZConfig
import com.google.inject.{Inject, Provides, Singleton}
import com.google.inject.name.Named
import com.twitter.inject.TwitterModule
import datainsider.client.service.{MockSchemaClientService, SchemaClientService}
import datainsider.client.util.TrackingClient
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.SSDBs
import org.nutz.ssdb4j.spi.SSDB
import org.quartz.impl.StdSchedulerFactory
import org.testcontainers.containers.DockerComposeContainer

import java.io.File
import java.util.Properties

object TestModule extends TwitterModule {

  override def configure: Unit = {
    bind[Engine[DataTable]].to[ClickhouseEngine].asEagerSingleton()
    bind[QueryService].to[QueryServiceImpl].asEagerSingleton()
    bind[QueryExecutor].to[QueryExecutorImpl].asEagerSingleton()
    bind[GeolocationService].to[GeolocationServiceImpl].asEagerSingleton()
    bind[DashboardFieldService].to[DashboardFieldServiceImpl].asEagerSingleton()
    bind[RlsPolicyService].to[RlsPolicyServiceImpl].asEagerSingleton()
    bind[UserActivityService].to[UserActivityServiceImpl].asEagerSingleton()
    bind[SchemaClientService].to[MockSchemaClientService].asEagerSingleton()
  }

  TrackingClient.setIsEnable(false)

  val clickhouseServiceName: String = ZConfig.getString("test_environment.clickhouse.service_name")
  val clickhouseHttpInterfacePort: Int = ZConfig.getInt("test_environment.clickhouse.http_interface_port")
  val clickhouseNativeInterfacePort: Int = ZConfig.getInt("test_environment.clickhouse.native_interface_port")
  val ssdbServiceName: String = ZConfig.getString("test_environment.ssdb.service_name")
  val ssdbServicePort: Int = ZConfig.getInt("test_environment.ssdb.port")
  val mysqlServiceName: String = ZConfig.getString("test_environment.mysql.service_name")
  val mysqlServicePort: Int = ZConfig.getInt("test_environment.mysql.port")

  val dockerContainer = new DockerComposeContainer(new File("./env/test/docker/docker-compose.yml"))
  dockerContainer.withExposedService(clickhouseServiceName, clickhouseHttpInterfacePort)
  dockerContainer.withExposedService(clickhouseServiceName, clickhouseNativeInterfacePort)
  dockerContainer.withExposedService(ssdbServiceName, ssdbServicePort)
  dockerContainer.withExposedService(mysqlServiceName, mysqlServicePort)
  dockerContainer.start()

  @Provides
  @Singleton
  @Named("mysql")
  def provideJdbcClient(): JdbcClient = {
    val host = dockerContainer.getServiceHost(clickhouseServiceName, mysqlServicePort)
    val port = dockerContainer.getServicePort(mysqlServiceName, mysqlServicePort)
    val jdbcUrl = s"jdbc:mysql://$host:$port?useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh"
    val user: String = ZConfig.getString("database.mysql.user")
    val password: String = ZConfig.getString("database.mysql.password")
    NativeJDbcClient(jdbcUrl, user, password)
//    NativeJDbcClient("jdbc:mysql://localhost:3306", "root", "di@2020!")
  }

  @Provides
  @Singleton
  def provideQueryParser(): QueryParser = {
    new QueryParserImpl(ClickhouseParser)
  }

  @Provides
  @Singleton
  @Named("clickhouse")
  def provideClickhouseClient(): JdbcClient = {
    val host = dockerContainer.getServiceHost(clickhouseServiceName, clickhouseHttpInterfacePort)
    val port = dockerContainer.getServicePort(clickhouseServiceName, clickhouseHttpInterfacePort)
    val jdbcUrl = s"jdbc:clickhouse://$host:$port"
    val user: String = ZConfig.getString("database.clickhouse.user")
    val password: String = ZConfig.getString("database.clickhouse.password")
    NativeJDbcClient(jdbcUrl, user, password)
//    NativeJDbcClient("jdbc:clickhouse://localhost:8123", "default", "")
  }

  @Singleton
  @Provides
  def providesSSDB(): SSDB = {
    val host: String = dockerContainer.getServiceHost(ssdbServiceName, ssdbServicePort)
    val port: Int = dockerContainer.getServicePort(ssdbServiceName, ssdbServicePort)
    val timeout: Int = ZConfig.getInt("ssdb.config.timeout_in_ms")
    SSDBs.pool(host, port, timeout, null)
//    SSDBs.pool("localhost", 8888, 3000, null)
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
    new MySqlSchemaManager(client, dbTestName)
  }

  @Singleton
  @Provides
  def provideMySqlDrillThroughFieldRepository(@Inject @Named("mysql") client: JdbcClient): DashboardFieldRepository = {
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
  def providesUserActivityRepository(
      @Named("clickhouse") client: JdbcClient
  ): UserActivityRepository = {
    val dbName: String = ZConfig.getString("fake_data.database.name")
    val tblName: String = ZConfig.getString("fake_data.table.user_activities.name", "user_activities")
    new ClickhouseActivityRepository(client, dbName, tblName)
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
}
