package co.datainsider.datacook.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.query.Limit
import co.datainsider.bi.service.{ConnectionService, QueryExecutor, QueryExecutorImpl}
import co.datainsider.bi.util.{Using, ZConfig}
import co.datainsider.datacook.domain.Ids.EtlJobId
import co.datainsider.datacook.pipeline.operator._
import co.datainsider.datacook.pipeline.operator.persist._
import co.datainsider.datacook.pipeline.{ExecutorResolver, ExecutorResolverImpl}
import co.datainsider.datacook.repository._
import co.datainsider.datacook.service._
import co.datainsider.datacook.service.scheduler.{ScheduleService, ScheduleServiceImpl}
import co.datainsider.datacook.service.worker.{MockWorkerService, WorkerService}
import co.datainsider.schema.service.{IngestionService, SchemaService}
import com.google.inject.Provides
import com.sendgrid.SendGrid
import com.twitter.inject.TwitterModule
import education.x.commons.{I32IdGenerator, KVS, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.{Named, Singleton}
import scala.io.Source

/**
  * @author tvc12 - Thien Vi
  * @created 09/20/2021 - 3:18 PM
  */
object TestDataCookModule extends TwitterModule {
  override def configure(): Unit = {
    super.configure()
    bind[ShareETLService].to[ShareETLServiceImpl].asEagerSingleton()
    bind[QueryExecutor].to[QueryExecutorImpl].asEagerSingleton()
    bind[ETLPreviewService].to[ETLPreviewServiceImpl].asEagerSingleton()

    bind[ETLService].to[ETLServiceImpl].asEagerSingleton()
    bind[TrashETLService].to[TrashETLServiceImpl].asEagerSingleton()
    bind[HistoryETLService].to[HistoryETLServiceImpl].asEagerSingleton()
    bind[WorkerService].to[MockWorkerService].asEagerSingleton()
  }

  @Singleton
  @Provides
  def provideETLRepository(@Named("mysql") client: JdbcClient): ETLRepository = {
    val dbName: String = ZConfig.getString("data_cook.test_mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.test_mysql.job_table")
    val shareTblName = ZConfig.getString("data_cook.mysql.share_table", "share_info")

    new ETLRepositoryImpl(client, dbName, tblName, shareTblName)
  }

  @Singleton
  @Provides
  def provideTrashETLRepository(@Named("mysql") client: JdbcClient): TrashETLRepository = {
    val dbName: String = ZConfig.getString("data_cook.test_mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.test_mysql.deleted_table")
    new TrashETLRepositoryImpl(client, dbName, tblName)
  }

  @Singleton
  @Provides
  def provideShareETLRepository(@Named("mysql") client: JdbcClient, ssdb: SSDB): ShareETLRepository = {
    val dbName: String = ZConfig.getString("data_cook.test_mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.test_mysql.share_table")
    val generator = I32IdGenerator("etl_share_service_test", "id", ssdb)
    new ShareETLRepositoryImpl(client, dbName, tblName, generator)
  }

  @Singleton
  @Provides
  def provideHistoryETLRepository(@Named("mysql") client: JdbcClient): HistoryETLRepository = {
    val dbName: String = ZConfig.getString("data_cook.test_mysql.dbname")
    val tblName: String = ZConfig.getString("data_cook.test_mysql.job_history_table")
    new HistoryETLRepositoryImpl(client, dbName, tblName)
  }

  @Singleton
  @Provides
  def providesDataCookScheduleService(
      jobService: ETLService,
      historyService: HistoryETLService,
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
  def providesOperatorService(
      schemaService: SchemaService,
      queryExecutor: QueryExecutor,
      ingestionService: IngestionService
  ): OperatorService = {
    val dbPrefix: String = ZConfig.getString("data_cook.prefix_db_name", "etl")
    val querySize = ZConfig.getInt("data_cook.query_size", 10000)
    val batchSize = ZConfig.getInt("data_cook.insert_batch_size", 100000)
    new OperatorServiceImpl(
      schemaService = schemaService,
      queryExecutor = queryExecutor,
      ingestionService = ingestionService,
      dbPrefix = dbPrefix,
      querySize = querySize,
      batchSize = batchSize
    )
  }

  @Named("preview_operator_service")
  @Singleton
  @Provides
  def providesPreviewOperatorService(
      schemaService: SchemaService,
      queryExecutor: QueryExecutor,
      ingestionService: IngestionService
  ): OperatorService = {
    val dbPrefix: String = ZConfig.getString("data_cook.preview_prefix_db_name", "preview_etl")
    val querySize = ZConfig.getInt("data_cook.query_size", 10000)
    val batchSize = ZConfig.getInt("data_cook.insert_batch_size", 100000)
    new OperatorServiceImpl(
      schemaService = schemaService,
      queryExecutor = queryExecutor,
      ingestionService = ingestionService,
      dbPrefix = dbPrefix,
      querySize = querySize,
      batchSize = batchSize
    )
  }

  @Singleton
  @Provides
  @Named("preview_executor_resolver")
  def providesPreviewExecutorResolver(
      connectionService: ConnectionService,
      @Named("preview_operator_service") operatorService: OperatorService
  ): ExecutorResolver = {
    val limit = Some(Limit(0, 1000))
    new ExecutorResolverImpl()
      .register(RootOperatorExecutor())
      .register(GetOperatorExecutor(operatorService, limit))
      .register(JoinOperatorExecutor(operatorService, limit))
      .register(ManageFieldOperatorExecutor(operatorService))
      .register(TransformOperatorExecutor(operatorService))
      .register(PivotOperatorExecutor(operatorService))
      .register(SQLOperatorExecutor(operatorService))
      .register(MockSaveDwhOperatorExecutor())
      .register(classOf[OraclePersistOperator], MockJdbcPersistOperatorExecutor())
      .register(classOf[MySQLPersistOperator], MockJdbcPersistOperatorExecutor())
      .register(classOf[MsSQLPersistOperator], MockJdbcPersistOperatorExecutor())
      .register(classOf[PostgresPersistOperator], MockJdbcPersistOperatorExecutor())
      .register(classOf[VerticaPersistOperator], MockJdbcPersistOperatorExecutor())
      .register(classOf[PythonOperator], createPythonExecutor(connectionService, operatorService))
      .register(classOf[SendEmailOperator], MockSendEmailExecutor())
      .register(classOf[SendGroupEmailOperator], MockGroupSendEmailExecutor())
  }

  private def createPythonExecutor(
      connectionService: ConnectionService,
      operatorService: OperatorService,
      executeTimeoutMs: Long = 60000
  ): Executor[PythonOperator] = {
    val templatePath: String = ZConfig.getString("data_cook.templates.python", "templates/main.py.template")
    val template: String = Using(Source.fromInputStream(getClass.getClassLoader.getResourceAsStream(templatePath)))(
      _.getLines().mkString("\n")
    )
    val tmpDir: String = ZConfig.getString("data_cook.tmp_dir")

    PythonOperatorExecutor(
      connectionService = connectionService,
      operatorService,
      template,
      baseDir = tmpDir,
      executeTimeoutMs = executeTimeoutMs
    )
  }

}
