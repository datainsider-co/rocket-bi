package co.datainsider.jobscheduler.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobscheduler.domain.{DataSourceFactory, DataSourceFactoryImpl}
import co.datainsider.jobscheduler.module.JobSchedulerModule.bindSingleton
import co.datainsider.jobscheduler.repository
import co.datainsider.jobscheduler.repository._
import co.datainsider.jobscheduler.service._
import com.google.inject.Provides
import com.google.inject.name.Named
import com.twitter.inject.TwitterModule
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.Singleton
object JobScheduleTestModule extends TwitterModule {

  override def configure: Unit = {
    bindSingleton[DataSourceFactory].to[DataSourceFactoryImpl]
    bindSingleton[JobService].to[JobServiceImpl]
    bindSingleton[ScheduleService].to[SimpleScheduleService]
    bindSingleton[DataSourceService].to[DataSourceServiceImpl]
    bindSingleton[HistoryService].to[HistoryServiceImpl]
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
    repository.MySqlSourceRepository(dataSourceFactory, client, dbName, tblName, fields)
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
    ZConfig.getString("schedule_service.access_token")
  }

  @Singleton
  @Provides
  def provideSSDBKVS(client: SSDB): SsdbKVS[Long, Boolean] = {
    val databaseName: String = ZConfig.getString("schedule_service.db_name")
    SsdbKVS[Long, Boolean](databaseName, client)
  }
}
