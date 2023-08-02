package co.datainsider.schema.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.service.ConnectionService
import co.datainsider.bi.util.ZConfig
import co.datainsider.schema.domain.CsvUploadInfo
import co.datainsider.schema.domain.requests.CreateDBRequest
import co.datainsider.schema.repository._
import co.datainsider.schema.service._
import com.google.inject.name.Named
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import education.x.commons.{I32IdGenerator, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

object SchemaModule extends TwitterModule {

  override def configure(): Unit = {
    super.configure()

    bind[String].annotatedWithName("admin_secret_key").toInstance(ZConfig.getString("admin_secret_key"))
    bind[String].annotatedWithName("service_key").toInstance(ZConfig.getString("service_key"))

    bind[SchemaService].to[SchemaServiceImpl].asEagerSingleton()
    bind[ShareService].to[ShareServiceImpl].asEagerSingleton()

    bindSingleton[SchemaRepository].to[SchemaRepositoryImpl]

    bind[OldCsvUploadService].to[OldCsvUploadServiceImpl].asEagerSingleton()
    bind[CsvIngestionService].to[CsvIngestionServiceImpl].asEagerSingleton()
  }

  @Singleton
  @Provides
  def providesSchemaMetadataStorage(@Named("mysql") client: JdbcClient): SchemaMetadataStorage = {
    val storage = new MySqlSchemaMetadataStorage(client)
    storage.ensureSchema()
    storage
  }

  @Singleton
  @Provides
  def providesCreateDbValidator(repository: SchemaRepository): Validator[CreateDBRequest] = {
    CreateDBValidator(repository)
  }

  @Singleton
  @Provides
  def provideSyncInfoRepository(
      @Named("mysql") client: JdbcClient
  ): FileSyncInfoRepository = {
    val dbName = ZConfig.getString("db.mysql.dbname")
    val tblName = ZConfig.getString("db.mysql.sync_info_tbl")
    new MySqlSyncInfoRepository(client, dbName, tblName)
  }

  @Singleton
  @Provides
  def provideSyncHistoryRepository(
      @Named("mysql") client: JdbcClient
  ): FileSyncHistoryRepository = {
    val dbName = ZConfig.getString("db.mysql.dbname")
    val tblName = ZConfig.getString("db.mysql.sync_history_tbl")
    new MySqlSyncHistoryRepository(client, dbName, tblName)
  }

  @Singleton
  @Provides
  def provideShareRepository(@Named("mysql") client: JdbcClient, ssdb: SSDB): ShareRepository = {
    MySqlShareRepository(
      client,
      ZConfig.getString("db.mysql.dbname"),
      ZConfig.getString("db.mysql.share_info_tbl"),
      I32IdGenerator("share_service", "id", ssdb)
    )
  }

  @Singleton
  @Provides
  def provideCsvInfoRepository(client: SSDB): CsvInfoRepository = {
    implicit val ec: ExecutionContextExecutor = ExecutionContext.global
    val dbKVS = SsdbKVS[String, CsvUploadInfo](s"di.csv_upload_info", client)

    new CsvInfoRepositoryImpl(dbKVS)
  }

  @Singleton
  @Provides
  def provideIngestionService(
      schemaService: SchemaService,
      connectionService: ConnectionService,
      engineResolver: EngineResolver
  ): IngestionService = {
    IngestionServiceImpl(
      schemaService = schemaService,
      connectionService = connectionService,
      engineResolver = engineResolver,
      batchSize = ZConfig.getInt("data_cook.insert_batch_size", 100000)
    )
  }

  @Named("hidden_db_name_patterns")
  @Singleton
  @Provides
  def provideHiddenDbRegexList(): Seq[String] = {
    ZConfig.getStringList("hidden_db_name_patterns", List.empty)
  }
}
