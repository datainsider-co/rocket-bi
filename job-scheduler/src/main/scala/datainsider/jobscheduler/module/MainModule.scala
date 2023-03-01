package datainsider.jobscheduler.module

import com.google.inject.Provides
import com.google.inject.name.Named
import com.twitter.inject.TwitterModule
import datainsider.jobscheduler.client.{HikariClient, HttpClient, JdbcClient, SimpleHttpClient}
import datainsider.jobscheduler.domain.{DataSourceFactory, DataSourceFactoryImpl}
import datainsider.jobscheduler.repository._
import datainsider.jobscheduler.service.{DataSourceService, DataSourceServiceImpl, HistoryService, HistoryServiceImpl, JobService, JobServiceImpl, ScheduleService, SimpleScheduleService}
import datainsider.jobscheduler.util.ZConfig
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.SSDBs
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.Singleton

/**
  * Created by SangDang on 9/16/16.
  */
object MainModule extends TwitterModule {
  override def configure: Unit = {
    bindSingleton[DataSourceFactory].to[DataSourceFactoryImpl]
    bindSingleton[JobService].to[JobServiceImpl]
    bindSingleton[ScheduleService].to[SimpleScheduleService]
    bindSingleton[DataSourceService].to[DataSourceServiceImpl]
    bindSingleton[HistoryService].to[HistoryServiceImpl]
    bindSingleton[SourceMetadataRepository].to[HttpSourceMetadataRepository]
  }

  @Singleton
  @Provides
  @Named("mysql")
  def provideMySqlClient(): JdbcClient = {
    val jdbcUrl = ZConfig.getString("database.mysql.url")
    val username = ZConfig.getString("database.mysql.username")
    val password = ZConfig.getString("database.mysql.password")

    HikariClient(jdbcUrl, username, password)
  }

  val dbName: String = ZConfig.getString("schema.live.dbname")

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
  def provideHttpClient: HttpClient = {
    val apiHost: String = ZConfig.getString("worker_host")
    new SimpleHttpClient(apiHost)
  }

  @Singleton
  @Provides
  @Named("access-token")
  def provideAccessToken(): String = {
    ZConfig.getString("access_token")
  }

  @Singleton
  @Provides
  def provideSSDB: SSDB = {
    val host: String = ZConfig.getString("database.ssdb.host")
    val port: Int = ZConfig.getInt("database.ssdb.port")
    val timeout: Int = ZConfig.getInt("database.ssdb.timeout_in_ms")
    SSDBs.pool(host, port, timeout, null)
  }

  @Singleton
  @Provides
  def provideSSDBKVS(client: SSDB): SsdbKVS[Long, Boolean] = {
    val databaseName: String = ZConfig.getString("database.ssdb.db_name")
    SsdbKVS[Long, Boolean](databaseName, client)
  }
}
