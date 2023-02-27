package datainsider.lakescheduler.module

import com.google.inject.Provides
import com.twitter.inject.TwitterModule
import com.google.inject.name.Named
import datainsider.jobscheduler.client.JdbcClient
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.util.ZConfig
import datainsider.lakescheduler.repository.{LakeHistoryRepository, LakeJobRepository, MysqlLakeJobHistoryRepository, MysqlLakeJobRepository}
import datainsider.lakescheduler.service.{LakeHistoryService, LakeHistoryServiceImpl, LakeJobService, LakeJobServiceImpl, LakeScheduleService, LakeScheduleServiceImpl}

import javax.inject.Singleton

object LakeJobModule extends TwitterModule {
  override def configure: Unit = {
    bindSingleton[LakeJobService].to[LakeJobServiceImpl]
    bindSingleton[LakeHistoryService].to[LakeHistoryServiceImpl]
    bindSingleton[LakeScheduleService].to[LakeScheduleServiceImpl]
  }

  val dbName: String = ZConfig.getString("schema.live.dbname")

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
  @Named("lake-history-schema")
  def provideLakeJobHistoryRepoSchemaManager(@Named("mysql") client: JdbcClient): SchemaManager = {
    val tblName = ZConfig.getString("schema.table.lake_history.name")
    val fields = ZConfig.getStringList("schema.table.lake_history.fields")
    new MysqlLakeJobHistoryRepository(client, dbName, tblName, fields)
  }

  @Singleton
  @Provides
  def provideMySqlLakeJobHistoryRepository(@Named("mysql") client: JdbcClient): LakeHistoryRepository = {
    val tblName = ZConfig.getString("schema.table.lake_history.name")
    val fields = ZConfig.getStringList("schema.table.lake_history.fields")
    new MysqlLakeJobHistoryRepository(client, dbName, tblName, fields)
  }
}
