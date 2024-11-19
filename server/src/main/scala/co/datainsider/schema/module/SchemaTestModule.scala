package co.datainsider.schema.module

import co.datainsider.bi.client.{JdbcClient, NativeJDbcClient}
import co.datainsider.bi.util.Implicits.FutureEnhance
import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.user_profile.client.{MockOrgAuthorizationClientService, MockProfileClientServiceImpl, OrgAuthorizationClientService, ProfileClientService}
import co.datainsider.schema.domain.CsvUploadInfo
import co.datainsider.schema.repository._
import co.datainsider.schema.service._
import com.google.inject.Provides
import com.google.inject.name.Named
import com.twitter.inject.TwitterModule
import education.x.commons.{I32IdGenerator, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.Singleton
import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}

object SchemaTestModule extends TwitterModule {

  override def configure(): Unit = {
    super.configure()

    bind[ShareService].to[ShareServiceImpl].asEagerSingleton()
    bind[OrgAuthorizationClientService].to[MockOrgAuthorizationClientService].asEagerSingleton()
    bind[ProfileClientService].to[MockProfileClientServiceImpl].asEagerSingleton()
    bind[SchemaRepository].to[SchemaRepositoryImpl].asEagerSingleton()

    bind[OldCsvUploadService].to[OldCsvUploadServiceImpl].asEagerSingleton()
    bind[CsvIngestionService].to[CsvIngestionServiceImpl].asEagerSingleton()
  }

  @Singleton
  @Provides
  def provideShareRepository(ssdb: SSDB): ShareRepository = {
    val dbName: String = ZConfig.getString("test_db.mysql.dbname")
    val host: String = ZConfig.getString("test_db.mysql.host")
    val port = ZConfig.getInt("test_db.mysql.port")
    val username: String = ZConfig.getString("test_db.mysql.username")
    val password: String = ZConfig.getString("test_db.mysql.password")
    val generator = I32IdGenerator("share_service", "id", ssdb)
    val client = NativeJDbcClient(
      s"jdbc:mysql://$host:$port/$dbName?useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh",
      username,
      password
    )
    MySqlShareRepository(
      client,
      ZConfig.getString("test_db.mysql.dbname"),
      ZConfig.getString("test_db.mysql.share_info_tbl"),
      generator
    )
  }

  @Singleton
  @Provides
  def providesSchemaMetadataStorage(@Named("mysql") client: JdbcClient): SchemaMetadataStorage = {
    val schemaMetadataStorage = new MySqlSchemaMetadataStorage(client)
    val schemaOk: Boolean = schemaMetadataStorage.ensureSchema().syncGet()
    if (!schemaOk) {
      throw new InternalError("schema metadata is invalid!")
    }

    schemaMetadataStorage
  }

  @Singleton
  @Provides
  def providesSchemaService(
      schemaRepository: SchemaRepository,
      orgAuthorizationClientService: OrgAuthorizationClientService,
      profileService: ProfileClientService
  ): SchemaService = {
    SchemaServiceImpl(
      schemaRepository = schemaRepository,
      createDbValidator = CreateDBValidator(schemaRepository),
      orgAuthorizationClientService,
      profileService
    )
  }

  @Singleton
  @Provides
  def provideCsvInfoRepository(client: SSDB): CsvInfoRepository = {
    implicit val ec: ExecutionContextExecutor = ExecutionContext.global
    val dbKVS = SsdbKVS[String, CsvUploadInfo](s"di.csv_upload_info", client)

    new CsvInfoRepositoryImpl(dbKVS)
  }

  @Named("hidden_db_name_patterns")
  @Singleton
  @Provides
  def provideHiddenDbRegexList(): Seq[String] = {
    ZConfig.getStringList("hidden_db_name_patterns", List.empty)
  }
}
