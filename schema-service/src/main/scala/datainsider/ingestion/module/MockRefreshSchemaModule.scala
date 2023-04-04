package datainsider.ingestion.module

import com.google.inject.Provides
import com.twitter.inject.TwitterModule
import datainsider.client.util.ZConfig
import datainsider.ingestion.domain.{ClickhouseSource, SystemInfo}
import datainsider.ingestion.repository.{SchemaMetadataStorage, SystemRepository, SystemRepositoryImpl}
import datainsider.ingestion.service.{RefreshSchemaWorker, RefreshSchemaWorkerImpl, SystemService, SystemServiceImpl}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.Singleton
import scala.util.Try;

/**
  * created 2022-08-03 11:36 AM
  *
  * @author tvc12 - Thien Vi
  */
object MockRefreshSchemaModule extends TwitterModule {

  @Singleton
  @Provides
  def providesSystemRepository(client: SSDB): SystemRepository = {
    val systemInfoDatabase = SsdbKVS[String, SystemInfo](s"di.system.info", client)

    val jdbcUrl: String = ZConfig.getString("db.clickhouse.url")
    val user: String = ZConfig.getString("db.clickhouse.user")
    val password: String = ZConfig.getString("db.clickhouse.password")
    val clusterName: Option[String] = Try(ZConfig.getString("db.clickhouse.cluster_name")).toOption
    val clickhouseSource = ClickhouseSource(jdbcUrl, user, password, clusterName)

    new SystemRepositoryImpl(clickhouseSource, systemInfoDatabase)
  }

  @Singleton
  @Provides
  def providesSystemService(repository: SystemRepository): SystemService = {
    new SystemServiceImpl(repository)
  }

  @Singleton
  @Provides
  def providesRefreshSchemaWorker(systemService: SystemService, storage: SchemaMetadataStorage): RefreshSchemaWorker = {
    val refreshInterval = ZConfig.getLong("db.clickhouse.refresh_schema_interval_ms", 3600000L)
    new RefreshSchemaWorkerImpl(systemService, storage, refreshInterval)
  }
}
