package datainsider.toolscheduler.module

import com.google.inject.Provides
import com.google.inject.name.Named
import com.twitter.inject.TwitterModule
import datainsider.jobscheduler.client.JdbcClient
import datainsider.jobscheduler.util.ZConfig
import datainsider.toolscheduler.module.ToolTestModule.bindSingleton
import datainsider.toolscheduler.repository.{
  MySqlToolHistoryRepository,
  MySqlToolJobRepository,
  ToolHistoryRepository,
  ToolJobRepository
}
import datainsider.toolscheduler.service.{
  ToolHistoryService,
  ToolHistoryServiceImpl,
  ToolJobService,
  ToolJobServiceImpl,
  ToolScheduleService,
  ToolScheduleServiceImpl
}

import javax.inject.Singleton

object ToolJobModule extends TwitterModule {

  override def configure: Unit = {
    bindSingleton[ToolJobService].to[ToolJobServiceImpl]
    bindSingleton[ToolHistoryService].to[ToolHistoryServiceImpl]
    bindSingleton[ToolScheduleService].to[ToolScheduleServiceImpl]
  }

  val dbName: String = ZConfig.getString("schema.live.dbname")

  @Singleton
  @Provides
  def provideToolJobRepository(@Named("mysql") client: JdbcClient): ToolJobRepository = {
    val tblName = ZConfig.getString("schema.table.tool_job.name")
    val fields = ZConfig.getStringList("schema.table.tool_job.fields")
    MySqlToolJobRepository(client, dbName, tblName, fields)
  }

  @Singleton
  @Provides
  def provideToolHistoryRepository(@Named("mysql") client: JdbcClient): ToolHistoryRepository = {
    val tblName = ZConfig.getString("schema.table.tool_history.name")
    val fields = ZConfig.getStringList("schema.table.tool_history.fields")
    MySqlToolHistoryRepository(client, dbName, tblName, fields)
  }
}
