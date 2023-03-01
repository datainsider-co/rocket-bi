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
import datainsider.data_cook.service._
import datainsider.data_cook.service.scheduler.{ScheduleService, ScheduleServiceImpl}
import datainsider.data_cook.service.table.{EtlTableService, EtlTableServiceImpl}
import datainsider.data_cook.service.worker.{MockWorkerService, WorkerService}
import datainsider.ingestion.domain.TableType
import datainsider.ingestion.repository._
import datainsider.ingestion.service._
import datainsider.ingestion.util.Using
import education.x.commons.{I32IdGenerator, KVS, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.{Named, Singleton}
import scala.io.Source

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 3:18 PM
  */
object DataCookTestModule extends TwitterModule {
  override def configure(): Unit = {
    super.configure()
    bind[EtlShareService].to[EtlShareServiceImpl].asEagerSingleton()
    bind[Engine[DataFrame]].to[ClickhouseEngine].asEagerSingleton()
    bind[QueryExecutor].to[QueryExecutorImpl].asEagerSingleton()
    bind[IngestionService].to[IngestionServiceImpl].asEagerSingleton()
    bind[PreviewEtlJobService].to[PreviewEtlJobServiceImpl].asEagerSingleton()

    bind[EtlJobService].to[EtlJobServiceImpl].asEagerSingleton()
    bind[TrashEtlJobService].to[TrashEtlJobServiceImpl].asEagerSingleton()
    bind[EtlJobHistoryService].to[EtlJobHistoryServiceImpl].asEagerSingleton()
    bind[WorkerService].to[MockWorkerService].asEagerSingleton()
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

    info(s"""
            |Clickhouse datasource:
            |Driver: $driverClass
            |URL: $jdbcUrl
            |User: $user
            |Password: $password
            |""".stripMargin)

    HikariClient(jdbcUrl, user, password)
  }

  @Singleton
  @Provides
  @Named("data_cook_clickhouse_writer")
  def providesClickHouseWriterClient(): JdbcClient = {
    val host: String = ZConfig.getString("data_cook.clickhouse.host")
    val port: String = ZConfig.getString("data_cook.clickhouse.http_port")
    val user: String = ZConfig.getString("data_cook.clickhouse.user")
    val password: String = ZConfig.getString("data_cook.clickhouse.password")
    val maxPoolSize: Int = ZConfig.getInt("data_cook.clickhouse.max_pool_size", 5)
    val jdbcUrl = s"jdbc:clickhouse://${host}:${port}?socket_timeout=0"

    HikariClient(jdbcUrl, user, password, maxPoolSize)
  }

  @Singleton
  @Provides
  @Named("clickhouse")
  def providesClickHouseClientTest(): JdbcClient = {
    val driverClass: String = ZConfig.getString("db.clickhouse.driver_class")
    val jdbcUrl: String = ZConfig.getString("db.clickhouse.url")
    val user: String = ZConfig.getString("db.clickhouse.user")
    val password: String = ZConfig.getString("db.clickhouse.password")

    info(s"""
            |Clickhouse datasource:
            |Driver: $driverClass
            |URL: $jdbcUrl
            |User: $user
            |Password: $password
            |""".stripMargin)

    HikariClient(jdbcUrl, user, password)
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
    val allDbName = ZConfig.getString("ssdb_key_test.etl_database.all_database", "test.di.etl.databases")
    val prefixKey = ZConfig.getString("ssdb_key_test.etl_database.prefix_db_key", "test.di.etl")
    SchemaMetadataStorageImpl(client, SsdbKVS(allDbName, client), prefixKey)
  }

  @Singleton
  @Provides
  @Named("etl_schema_repository")
  def providesSchemaRepository(
      ddlExecutor: DDLExecutor,
      @Named("etl_metadata_storage") schemaRepository: SchemaMetadataStorage
  ): SchemaRepository = {
    SchemaRepositoryImpl(ddlExecutor, schemaRepository)
  }

  @Singleton
  @Provides
  @Named("etl_schema_service")
  def providesSchemaService(
      @Named("etl_schema_repository") schemaRepository: SchemaRepository,
      orgAuthorizationClientService: OrgAuthorizationClientService,
      profileService: ProfileClientService
  ): SchemaService = {
    SchemaServiceImpl(
      schemaRepository = schemaRepository,
      createDbValidator = CreateDBValidator(schemaRepository),
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
    val dbName: String = ZConfig.getString("data_cook.test_mysql.dbname")
    val host: String = ZConfig.getString("data_cook.test_mysql.host")
    val port = ZConfig.getInt("data_cook.test_mysql.port")
    val username: String = ZConfig.getString("data_cook.test_mysql.username")
    val password: String = ZConfig.getString("data_cook.test_mysql.password")

    HikariClient(
      s"jdbc:mysql://$host:$port/$dbName?useUnicode=yes&characterEncoding=UTF-8&useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh",
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
    new EtlTableServiceImpl(parser, schemaService, ingestionService, queryExecutor, dbPrefix, TableType.InMemory)
  }

  @Singleton
  @Provides
  def provideEtlJobRepository(@Named("data_cook_mysql") client: JdbcClient): EtlJobRepository = {
    val dbName: String = ZConfig.getString("data_cook.test_mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.test_mysql.job_table")
    val shareTblName = ZConfig.getString("data_cook.mysql.share_table", "share_info")

    new EtlJobRepositoryImpl(client, dbName, tblName, shareTblName)
  }

  @Singleton
  @Provides
  def provideDeletedEtlJobRepository(@Named("data_cook_mysql") client: JdbcClient): TrashEtlJobRepository = {
    val dbName: String = ZConfig.getString("data_cook.test_mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.test_mysql.deleted_table")
    new DeletedEtlJobRepositoryImpl(client, dbName, tblName)
  }

  @Singleton
  @Provides
  def provideShareEtlJobRepository(@Named("data_cook_mysql") client: JdbcClient, ssdb: SSDB): ShareEtlJobRepository = {
    val dbName: String = ZConfig.getString("data_cook.test_mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.test_mysql.share_table")
    val generator = I32IdGenerator("etl_share_service_test", "id", ssdb)
    new ShareEtlJobRepositoryImpl(client, dbName, tblName, generator)
  }

  @Singleton
  @Provides
  def provideEtlJobHistoryRepository(@Named("data_cook_mysql") client: JdbcClient): EtlJobHistoryRepository = {
    val dbName: String = ZConfig.getString("data_cook.test_mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.test_mysql.job_history_table")
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
    new EtlTableServiceImpl(parser, schemaService, ingestionService, queryExecutor, dbPrefix, TableType.InMemory)
  }

  @Singleton
  @Provides
  def providesDataCookScheduleService(
      jobService: EtlJobService,
      historyService: EtlJobHistoryService,
      client: SSDB
  ): ScheduleService = {
    val serviceName = ZConfig.getString("data_cook.running_job_db_test", "data_cook.running_job_test")
    val runningJobMap: KVS[EtlJobId, Boolean] = new SsdbKVS[EtlJobId, Boolean](serviceName, client)
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
    val sendGrid = new SendGrid(apiKey)
    SendGridEmailService(sendGrid, sender, senderName, rateLimitRetry, sleepInMills, limitSizeInBytes)
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
      @Named("data_cook_clickhouse_writer") writerClient: JdbcClient,
      dwhRepository: DwhRepository,
      sendEmailExecutor: Executor[SendEmailOperator],
      sendGroupEmailExecutor: Executor[SendGroupEmailOperator],
      pythonOperatorExecutor: Executor[PythonOperator]
  ): ExecutorResolver = {
    val chunkSize = ZConfig.getInt("data_cook.query_size", 1000)
    val jdbcPersistExecutor: Executor[_] = JDBCPersistOperatorExecutor(dwhRepository, chunkSize)
    val limit = Some(Limit(0, 500))

    new ExecutorResolverImpl()
      .register(RootOperatorExecutor())
      .register(GetOperatorExecutor(tableService, limit, client))
      .register(JoinOperatorExecutor(tableService, limit))
      .register(ManageFieldOperatorExecutor(tableService))
      .register(TransformOperatorExecutor(tableService))
      .register(PivotOperatorExecutor(tableService))
      .register(SQLOperatorExecutor(tableService))
      .register(pythonOperatorExecutor)
      .register(SaveDwhOperatorExecutor(schemaService, writerClient))
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
      @Named("data_cook_clickhouse") client: JdbcClient,
      pythonOperatorExecutor: Executor[PythonOperator]
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
      .register(pythonOperatorExecutor)
      .register(TestSaveDwhOperatorExecutor())
      .register(classOf[OraclePersistOperator], jdbcPersistExecutor)
      .register(classOf[MySQLPersistOperator], jdbcPersistExecutor)
      .register(classOf[MsSQLPersistOperator], jdbcPersistExecutor)
      .register(classOf[PostgresPersistOperator], jdbcPersistExecutor)
      .register(classOf[VerticaPersistOperator], jdbcPersistExecutor)
      .register(classOf[SendEmailOperator], TestSendEmailExecutor())
      .register(classOf[SendGroupEmailOperator], TestGroupSendEmailExecutor())
  }

  @Provides
  @Singleton
  def providesPythonOperatorExecutor(
      @Named("preview_table_service") tableService: EtlTableService,
      @Named("etl_schema_service") schemaService: SchemaService
  ): Executor[PythonOperator] = {
    val templatePath: String = ZConfig.getString("data_cook.templates.python", "templates/main.py.template")
    val template: String = Using(Source.fromInputStream(getClass.getClassLoader.getResourceAsStream(templatePath)))(_.getLines().mkString("\n"))
    val host: String = ZConfig.getString("data_cook.clickhouse.host")
    val port: String = ZConfig.getString("data_cook.clickhouse.http_port")
    val user: String = ZConfig.getString("data_cook.clickhouse.user")
    val password: String = ZConfig.getString("data_cook.clickhouse.password")

    new PythonOperatorExecutor(
      tableService,
      schemaService,
      template,
      baseDir = "./tmp",
      clickhouseHost = host,
      clickhousePort = port,
      clickhouseUser = user,
      clickhousePass = password,
      executeTimeoutMs = 2000
    )
  }
}
