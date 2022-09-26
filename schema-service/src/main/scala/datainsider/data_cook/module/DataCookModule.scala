package datainsider.data_cook.module

import com.google.inject.Provides
import com.sendgrid.SendGrid
import com.twitter.inject.TwitterModule
import datainsider.client.domain.engine.Engine
import datainsider.client.domain.engine.clickhouse.{ClickhouseEngine, ClickhouseParser, DataFrame}
import datainsider.client.domain.query.{Limit, QueryParser, QueryParserImpl}
import datainsider.client.service._
import datainsider.client.util.{HikariClient, JdbcClient, ZConfig}
import datainsider.data_cook.domain.Ids.EtlJobId
import datainsider.data_cook.pipeline.operator._
import datainsider.data_cook.pipeline.operator.persist._
import datainsider.data_cook.pipeline.{ExecutorResolver, ExecutorResolverImpl}
import datainsider.data_cook.repository._
import datainsider.data_cook.service.{_}
import datainsider.data_cook.service.scheduler.{ScheduleService, ScheduleServiceImpl}
import datainsider.data_cook.service.table.{EtlTableService, EtlTableServiceImpl}
import datainsider.data_cook.service.worker.{WorkerServiceImpl, WorkerService}
import datainsider.ingestion.domain.TableType
import datainsider.ingestion.repository._
import datainsider.ingestion.service._
import education.x.commons.{I32IdGenerator, KVS, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.{Named, Singleton}

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 3:18 PM
  */
object DataCookModule extends TwitterModule {
  override def configure(): Unit = {
    super.configure()
    bind[EtlShareService].to[EtlShareServiceImpl].asEagerSingleton()
    bind[Engine[DataFrame]].to[ClickhouseEngine].asEagerSingleton()
    bind[QueryExecutor].to[QueryExecutorImpl].asEagerSingleton()
    bind[IngestionService].to[IngestionServiceImpl].asEagerSingleton()
    bind[PreviewEtlJobService].to[PreviewEtlJobServiceImpl].asEagerSingleton()

    bind[WorkerService].to[WorkerServiceImpl].asEagerSingleton()

    bind[EtlJobService].to[EtlJobServiceImpl].asEagerSingleton()
    bind[TrashEtlJobService].to[TrashEtlJobServiceImpl].asEagerSingleton()
    bind[EtlJobHistoryService].to[EtlJobHistoryServiceImpl].asEagerSingleton()
  }

  // client using insert synced
  @Singleton
  @Provides
  @Named("data_cook_clickhouse")
  def providesClickHouseClient(): JdbcClient = {
    val driverClass: String = ZConfig.getString("db.clickhouse.driver_class")
    val jdbcUrl: String = ZConfig.getString("db.clickhouse.url")
    val user: String = ZConfig.getString("db.clickhouse.user")
    val password: String = ZConfig.getString("db.clickhouse.password")
    val maxPoolSize: Int = ZConfig.getInt("db.clickhouse.max_pool_size", 50)

    HikariClient(jdbcUrl, user, password, maxPoolSize = maxPoolSize)
  }

  @Provides
  @Singleton
  def bindQueryParser(): QueryParser = {
    new QueryParserImpl(ClickhouseParser)
  }

  @Singleton
  @Provides
  @Named("etl_metadata_storage")
  def providesSchemaMetadataStorage(client: SSDB): SchemaMetadataStorage = {
    val allDbName = ZConfig.getString("ssdb_key.etl_database.all_database", "test.di.etl.databases")
    val prefixKey = ZConfig.getString("ssdb_key.etl_database.prefix_db_key", "test.di.etl")
    SchemaMetadataStorageImpl(client, SsdbKVS(allDbName, client), prefixKey)
  }

  @Singleton
  @Provides
  @Named("etl_schema_repository")
  def providesSchemaRepository(
      executor: DDLExecutor,
      @Named("etl_metadata_storage") storage: SchemaMetadataStorage
  ): SchemaRepository = {
    SchemaRepositoryImpl(executor, storage)
  }

  @Singleton
  @Provides
  @Named("etl_schema_service")
  def providesSchemaService(
      @Named("etl_schema_repository") repository: SchemaRepository,
      orgAuthorizationClientService: OrgAuthorizationClientService,
      profileService: ProfileClientService
  ): SchemaService = {
    SchemaServiceImpl(
      schemaRepository = repository,
      createDbValidator = CreateDBValidator(repository),
      orgAuthorizationClientService = orgAuthorizationClientService,
      profileService = profileService
    )
  }

  @Singleton
  @Provides
  @Named("etl_ingestion_service")
  def providesIngestionService(
      @Named("etl_schema_service") schemaService: SchemaService,
      @Named("data_cook_clickhouse") client: JdbcClient
  ): IngestionService = {
    IngestionServiceImpl(schemaService, ClickHouseDataRepository(client))
  }

  @Provides
  @Singleton
  @Named("data_cook_mysql")
  def providesMySQLClient(): JdbcClient = {
    val host: String = ZConfig.getString("data_cook.mysql.host")
    val port = ZConfig.getInt("data_cook.mysql.port")
    val username: String = ZConfig.getString("data_cook.mysql.username")
    val password: String = ZConfig.getString("data_cook.mysql.password")

    HikariClient(
      s"jdbc:mysql://$host:$port/?useUnicode=yes&characterEncoding=UTF-8&useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh",
      username,
      password
    )
  }

  @Singleton
  @Provides
  def providesEtlTableService(
      parser: QueryParser,
      @Named("etl_schema_service") schemaService: SchemaService,
      @Named("etl_ingestion_service") ingestionService: IngestionService,
      queryExecutor: QueryExecutor
  ): EtlTableService = {
    val dbPrefix = ZConfig.getString("data_cook.prefix_db_name", "etl")
    new EtlTableServiceImpl(parser, schemaService, ingestionService, queryExecutor, dbPrefix, TableType.Default)
  }

  @Singleton
  @Provides
  def provideEtlJobRepository(@Named("data_cook_mysql") client: JdbcClient): EtlJobRepository = {
    val dbName: String = ZConfig.getString("data_cook.mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.mysql.job_table")
    new EtlJobRepositoryImpl(client, dbName, tblName)
  }

  @Singleton
  @Provides
  def provideDeletedEtlJobRepository(@Named("data_cook_mysql") client: JdbcClient): TrashEtlJobRepository = {
    val dbName: String = ZConfig.getString("data_cook.mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.mysql.deleted_table")
    new DeletedEtlJobRepositoryImpl(client, dbName, tblName)
  }

  @Singleton
  @Provides
  def provideShareEtlJobRepository(@Named("data_cook_mysql") client: JdbcClient, ssdb: SSDB): ShareEtlJobRepository = {
    val dbName: String = ZConfig.getString("data_cook.mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.mysql.share_table")
    val generator = I32IdGenerator("etl_share_service", "id", ssdb)
    new ShareEtlJobRepositoryImpl(client, dbName, tblName, generator)
  }

  @Singleton
  @Provides
  def provideEtlJobHistoryRepository(@Named("data_cook_mysql") client: JdbcClient): EtlJobHistoryRepository = {
    val dbName: String = ZConfig.getString("data_cook.mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.mysql.job_history_table")
    new EtlJobHistoryRepositoryImpl(client, dbName, tblName)
  }

  @Singleton
  @Provides
  @Named("preview_table_service")
  def providesPreviewEtlTableService(
      parser: QueryParser,
      @Named("etl_schema_service") schemaService: SchemaService,
      @Named("etl_ingestion_service") ingestionService: IngestionService,
      queryExecutor: QueryExecutor
  ): EtlTableService = {
    val dbPrefix = ZConfig.getString("data_cook.preview_prefix_db_name", "preview_etl")
    new EtlTableServiceImpl(
      parser,
      schemaService,
      ingestionService,
      queryExecutor,
      dbPrefix,
      tableType = TableType.InMemory
    )
  }

  @Singleton
  @Provides
  def providesRunningJobMap(jobService: EtlJobService, client: SSDB): KVS[EtlJobId, Boolean] = {
    val serviceName = ZConfig.getString("data_cook.running_job_db", "data_cook.running_job")
    new SsdbKVS[EtlJobId, Boolean](serviceName, client)
  }

  @Singleton
  @Provides
  def providesDataCookScheduleService(
      jobService: EtlJobService,
      historyService: EtlJobHistoryService,
      runningJobMap: KVS[EtlJobId, Boolean]
  ): ScheduleService = {
    new ScheduleServiceImpl(jobService, historyService, runningJobMap = runningJobMap)
  }

  @Singleton
  @Provides
  def providesEmailService(): EmailService = {
    val apiKey: String = ZConfig.getString("data_cook.send_grid.api_key")
    val sender: String = ZConfig.getString("data_cook.send_grid.sender")
    val senderName: String = ZConfig.getString("data_cook.send_grid.sender_name")
    val rateLimitRetry: Int = ZConfig.getInt("data_cook.send_grid.rate_limit_retry")
    val sleepInMills: Int = ZConfig.getInt("data_cook.send_grid.sleep_in_mills")
    val limitSizeInBytes: Int = ZConfig.getInt("data_cook.send_grid.limit_size_in_bytes")
    SendGridEmailService(new SendGrid(apiKey), sender, senderName, rateLimitRetry, sleepInMills, limitSizeInBytes)
  }

  @Singleton
  @Provides
  def providesSendEmailExecutor(emailService: EmailService): Executor[SendEmailOperator] = {
    val host: String = ZConfig.getString("data_cook.clickhouse.host")
    val port: String = ZConfig.getString("data_cook.clickhouse.port")
    val user: String = ZConfig.getString("data_cook.clickhouse.user")
    val password: String = ZConfig.getString("data_cook.clickhouse.password")
    val baseDir: String = ZConfig.getString("data_cook.mail_dir")
    SendEmailOperatorExecutor(
      emailService = emailService,
      baseDir = baseDir,
      clickhouseHost = host,
      clickhousePort = port,
      clickhouseUser = user,
      clickhousePass = password
    )
  }

  @Singleton
  @Provides
  def providesSendGroupEmailExecutor(emailService: EmailService): Executor[SendGroupEmailOperator] = {
    val host: String = ZConfig.getString("data_cook.clickhouse.host")
    val port: String = ZConfig.getString("data_cook.clickhouse.port")
    val user: String = ZConfig.getString("data_cook.clickhouse.user")
    val password: String = ZConfig.getString("data_cook.clickhouse.password")
    val baseDir: String = ZConfig.getString("data_cook.mail_dir")
    SendGroupEmailOperatorExecutor(
      emailService = emailService,
      baseDir = baseDir,
      clickhouseHost = host,
      clickhousePort = port,
      clickhouseUser = user,
      clickhousePass = password
    )
  }

  @Provides
  @Singleton
  def providesExecutorResolver(
      tableService: EtlTableService,
      schemaService: SchemaService,
      @Named("data_cook_clickhouse") client: JdbcClient,
      dwhRepository: DwhRepository,
      sendEmailExecutor: Executor[SendEmailOperator],
      sendGroupEmailExecutor: Executor[SendGroupEmailOperator]
  ): ExecutorResolver = {
    val chunkSize = ZConfig.getInt("data_cook.query_size", 1000)
    val jdbcPersistExecutor: Executor[_] = JDBCPersistOperatorExecutor(dwhRepository, chunkSize)
    new ExecutorResolverImpl()
      .register(RootOperatorExecutor())
      .register(GetOperatorExecutor(tableService, None, client))
      .register(JoinOperatorExecutor(tableService, None))
      .register(ManageFieldOperatorExecutor(tableService))
      .register(TransformOperatorExecutor(tableService))
      .register(PivotOperatorExecutor(tableService))
      .register(SQLOperatorExecutor(tableService))
      .register(SaveDwhOperatorExecutor(schemaService, client))
      .register(classOf[OraclePersistOperator], jdbcPersistExecutor)
      .register(classOf[MySQLPersistOperator], jdbcPersistExecutor)
      .register(classOf[MsSQLPersistOperator], jdbcPersistExecutor)
      .register(classOf[PostgresPersistOperator], jdbcPersistExecutor)
      .register(classOf[VerticaPersistOperator], jdbcPersistExecutor)
      .register(classOf[SendEmailOperator], sendEmailExecutor)
      .register(classOf[SendGroupEmailOperator], sendGroupEmailExecutor)
  }

  @Provides
  @Singleton
  @Named("preview_executor_resolver")
  def providesPreviewExecutorResolver(
      @Named("preview_table_service") tableService: EtlTableService,
      @Named("data_cook_clickhouse") client: JdbcClient
  ): ExecutorResolver = {
    val jdbcPersistExecutor: Executor[_] = TestJDBCPersistOperatorExecutor()
    val limit: Option[Limit] = Some(Limit(0, 500))
    new ExecutorResolverImpl()
      .register(RootOperatorExecutor())
      .register(GetOperatorExecutor(tableService, limit, client))
      .register(JoinOperatorExecutor(tableService, limit))
      .register(ManageFieldOperatorExecutor(tableService))
      .register(TransformOperatorExecutor(tableService))
      .register(PivotOperatorExecutor(tableService))
      .register(SQLOperatorExecutor(tableService))
      .register(TestSaveDwhOperatorExecutor())
      .register(classOf[OraclePersistOperator], jdbcPersistExecutor)
      .register(classOf[MySQLPersistOperator], jdbcPersistExecutor)
      .register(classOf[MsSQLPersistOperator], jdbcPersistExecutor)
      .register(classOf[PostgresPersistOperator], jdbcPersistExecutor)
      .register(classOf[VerticaPersistOperator], jdbcPersistExecutor)
      .register(classOf[SendEmailOperator], TestSendEmailExecutor())
      .register(classOf[SendGroupEmailOperator], TestGroupSendEmailExecutor())
  }
}
