package datainsider.lakescheduler.module

import com.google.inject.Provides
import com.google.inject.name.Named
import com.twitter.inject.TwitterModule
import datainsider.jobscheduler.client.JdbcClient
import datainsider.jobscheduler.module.TestModule.bindSingleton
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.util.ZConfig
import datainsider.lakescheduler.repository.{LakeHistoryRepository, MysqlLakeJobHistoryRepository}
import datainsider.lakescheduler.service.{LakeHistoryService, LakeHistoryServiceImpl, LakeJobService, LakeJobServiceImpl}
import org.testcontainers.containers.DockerComposeContainer

import java.io.File
import javax.inject.Singleton

object LakeTestModule extends TwitterModule {

  override def configure(): Unit = {
    bindSingleton[LakeJobService].to[LakeJobServiceImpl]
    bindSingleton[LakeHistoryService].to[LakeHistoryServiceImpl]
  }

  val dbName: String = ZConfig.getString("schema.test.dbname")

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
