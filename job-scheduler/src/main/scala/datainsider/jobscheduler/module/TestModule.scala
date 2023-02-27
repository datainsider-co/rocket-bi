package datainsider.jobscheduler.module

import com.google.inject.Provides
import com.google.inject.name.Named
import com.twitter.inject.TwitterModule
import datainsider.jobscheduler.client.{HttpClient, JdbcClient, NativeJdbcClient, SimpleHttpClient}
import datainsider.jobscheduler.domain.{DataSourceFactory, DataSourceFactoryImpl}
import datainsider.jobscheduler.repository._
import datainsider.jobscheduler.service._
import datainsider.jobscheduler.util.ZConfig
import datainsider.lakescheduler.repository.{LakeJobRepository, MysqlLakeJobRepository}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.SSDBs
import org.nutz.ssdb4j.spi.SSDB
import org.testcontainers.containers.DockerComposeContainer

import java.io.File
import javax.inject.Singleton
object TestModule extends TwitterModule {

  override def configure: Unit = {
    bindSingleton[DataSourceFactory].to[DataSourceFactoryImpl]
    bindSingleton[JobService].to[JobServiceImpl]
    bindSingleton[ScheduleService].to[SimpleScheduleService]
    bindSingleton[DataSourceService].to[DataSourceServiceImpl]
    bindSingleton[SourceMetadataRepository].to[MockSourceMetadataRepository]
  }

  val dockerContainer = new DockerComposeContainer(new File("./env/test/docker/docker-compose.yml"))
  val ssdbServiceName: String = ZConfig.getString("test_environment.ssdb.service_name")
  val ssdbServicePort: Int = ZConfig.getInt("test_environment.ssdb.port")
  val mysqlServiceName: String = ZConfig.getString("test_environment.mysql.service_name")
  val mysqlServicePort: Int = ZConfig.getInt("test_environment.mysql.port")
  dockerContainer.withExposedService(ssdbServiceName, ssdbServicePort)
  dockerContainer.withExposedService(mysqlServiceName, mysqlServicePort)
  dockerContainer.start()

  @Singleton
  @Provides
  @Named("mysql")
  def provideMySqlClient(): JdbcClient = {
    val host: String = dockerContainer.getServiceHost(mysqlServiceName, mysqlServicePort)
    val port: Integer = dockerContainer.getServicePort(mysqlServiceName, mysqlServicePort)
    val jdbcUrl = s"jdbc:mysql://$host:$port?useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh"
    val username = ZConfig.getString("database.mysql.username")
    val password = ZConfig.getString("database.mysql.password")

    NativeJdbcClient(jdbcUrl, username, password)

//    NativeJdbcClient(
//      "jdbc:mysql://localhost:3306?useLegacyDatetimeCode=false&serverTimezone=Asia/Ho_Chi_Minh",
//      "root",
//      "di@2020!"
//    )
  }

  @Singleton
  @Provides
  def provideSSDB: SSDB = {
    val host: String = dockerContainer.getServiceHost(mysqlServiceName, mysqlServicePort)
    val port: Int = dockerContainer.getServicePort(mysqlServiceName, mysqlServicePort)
    val timeout: Int = ZConfig.getInt("database.ssdb.timeout_in_ms")
    SSDBs.pool(host, port, timeout, null)

//    SSDBs.pool("localhost", 8888, 100, null)
  }

  val dbName: String = ZConfig.getString("schema.test.dbname")

  @Singleton
  @Provides
  @Named("job-schema")
  def provideJobRepoSchemaManager(@Named("mysql") client: JdbcClient): SchemaManager = {
    val tblName = ZConfig.getString("schema.table.job.name")
    val fields = ZConfig.getStringList("schema.table.job.fields")
    new MySqlJobRepository(client, dbName, tblName, fields)
  }

  @Singleton
  @Provides
  def provideMySqlJobRepository(@Named("mysql") client: JdbcClient): JobRepository = {
    val tblName = ZConfig.getString("schema.table.job.name")
    val fields = ZConfig.getStringList("schema.table.job.fields")
    new MySqlJobRepository(client, dbName, tblName, fields)
  }

  @Singleton
  @Provides
  @Named("source-schema")
  def provideDataSourceRepoSchemaManager(
      @Named("mysql") client: JdbcClient,
      dataSourceFactory: DataSourceFactory
  ): SchemaManager = {
    val tblName = ZConfig.getString("schema.table.source.name")
    val fields = ZConfig.getStringList("schema.table.source.fields")
    MySqlSourceRepository(dataSourceFactory, client, dbName, tblName, fields)
  }

  @Singleton
  @Provides
  def provideMySqlDataSourceRepository(
      @Named("mysql") client: JdbcClient,
      dataSourceFactory: DataSourceFactory
  ): DataSourceRepository = {
    val tblName = ZConfig.getString("schema.table.source.name")
    val fields = ZConfig.getStringList("schema.table.source.fields")
    MySqlSourceRepository(dataSourceFactory, client, dbName, tblName, fields)
  }

  @Singleton
  @Provides
  @Named("history-schema")
  def provideJobHistoryRepoSchemaManager(@Named("mysql") client: JdbcClient): SchemaManager = {
    val tblName = ZConfig.getString("schema.table.history.name")
    val fields = ZConfig.getStringList("schema.table.history.fields")
    new MySqlJobHistoryRepository(client, dbName, tblName, fields)
  }

  @Singleton
  @Provides
  def provideMySqlJobHistoryRepository(@Named("mysql") client: JdbcClient): JobHistoryRepository = {
    val tblName = ZConfig.getString("schema.table.history.name")
    val fields = ZConfig.getStringList("schema.table.history.fields")
    new MySqlJobHistoryRepository(client, dbName, tblName, fields)
  }

  @Singleton
  @Provides
  @Named("access-token")
  def provideAccessToken(): String = {
    ZConfig.getString("access_token")
  }

  @Singleton
  @Provides
  def provideHttpClient: HttpClient = {
    val apiHost: String = ZConfig.getString("worker_host")
    new SimpleHttpClient(apiHost)
  }

  @Singleton
  @Provides
  @Named("lake-job-schema")
  def provideLakeJobRepoSchemaManager(@Named("mysql") client: JdbcClient): SchemaManager = {
    val tblName = ZConfig.getString("schema.table.lake_job.name")
    val fields = ZConfig.getStringList("schema.table.lake_job.fields")
    new MysqlLakeJobRepository(client, dbName, tblName, fields)
  }

  @Singleton
  @Provides
  def provideLakeRepository(@Named("mysql") client: JdbcClient): LakeJobRepository = {
    val tblName = ZConfig.getString("schema.table.lake_job.name")
    val fields = ZConfig.getStringList("schema.table.lake_job.fields")
    new MysqlLakeJobRepository(client, dbName, tblName, fields)
  }

  @Singleton
  @Provides
  def provideSSDBKVS(client: SSDB): SsdbKVS[Long, Boolean] = {
    val databaseName: String = ZConfig.getString("database.ssdb.db_name")
    SsdbKVS[Long, Boolean](databaseName, client)
  }
}
