package datainsider.ingestion.module

import com.google.inject.Provides
import com.twitter.inject.{Injector, TwitterModule}
import datainsider.client.util.ZConfig
import datainsider.ingestion.domain.{ClickhouseConnectionSetting, ClickhouseSource, SystemInfo}
import datainsider.ingestion.repository.{SchemaMetadataStorage, SystemRepository, SystemRepositoryImpl}
import datainsider.ingestion.service.{RefreshSchemaWorker, RefreshSchemaWorkerImpl, SystemService, SystemServiceImpl}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.Singleton
import scala.util.Try

/**
  * created 2022-07-21 9:55 PM
  *
  * @author tvc12 - Thien Vi
  */
object RefreshSchemaModule extends TwitterModule {

  override def singletonPostWarmupComplete(injector: Injector): Unit = {
    super.singletonPostWarmupComplete(injector)
    val isAutoRefreshSchema: Boolean = ZConfig.getBoolean("db.clickhouse.is_auto_refresh_schema", false)
    if (isAutoRefreshSchema) {
      injector.instance[RefreshSchemaWorker].start()
    }
  }

  @Singleton
  @Provides
  def providesRefreshSchemaWorker(systemService: SystemService, storage: SchemaMetadataStorage): RefreshSchemaWorker = {
    val refreshInterval = ZConfig.getLong("db.clickhouse.refresh_schema_interval_ms", 3600000L)
    new RefreshSchemaWorkerImpl(systemService, storage, refreshInterval)
  }

  @Singleton
  @Provides
  def providesSystemRepository(
      client: SSDB,
      clickhouseConnSetting: Option[ClickhouseConnectionSetting]
  ): SystemRepository = {
    val systemInfoDatabase = SsdbKVS[String, SystemInfo](s"di.system.info", client)

    val clickhouseSource = if (clickhouseConnSetting.isDefined) {
      val jdbcUrl: String = clickhouseConnSetting.get.toJdbcUrl
      val user: String = clickhouseConnSetting.get.username
      val password: String = clickhouseConnSetting.get.password
      val clusterName: Option[String] = clickhouseConnSetting.get.clusterName
      ClickhouseSource(jdbcUrl, user, password, clusterName)
    } else {
      val jdbcUrl: String = ZConfig.getString("db.clickhouse.url")
      val user: String = ZConfig.getString("db.clickhouse.user")
      val password: String = ZConfig.getString("db.clickhouse.password")
      val clusterName: Option[String] = Try(ZConfig.getString("db.clickhouse.cluster_name")).toOption
      ClickhouseSource(jdbcUrl, user, password, clusterName)
    }

    new SystemRepositoryImpl(clickhouseSource, systemInfoDatabase)
  }

  @Singleton
  @Provides
  def providesSystemService(repository: SystemRepository): SystemService = {
    new SystemServiceImpl(repository)
  }
}
