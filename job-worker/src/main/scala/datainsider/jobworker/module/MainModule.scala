package datainsider.jobworker.module

import com.google.inject.name.Named
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import datainsider.client.service.{HadoopFileClientService, LakeClientService, SchemaClientService}
import datainsider.client.util.ZConfig
import datainsider.jobworker.client.{HikariClient, HttpClient, JdbcClient, SimpleHttpClient}
import datainsider.jobworker.domain.job.{FacebookAdsJob, Ga4Job, TikTokAdsJob}
import datainsider.jobworker.domain.setting.ClickhouseConnectionSetting
import datainsider.jobworker.domain.source.{FacebookAdsSource, Ga4Source, TikTokAdsSource}
import datainsider.jobworker.domain.{DatabaseType, GoogleServiceAccountSource, JdbcSource}
import datainsider.jobworker.repository.reader.facebook_ads.FacebookAdsFactory
import datainsider.jobworker.repository.reader.factory.{
  Ga4ReaderFactory,
  Ga4ServiceAccountReaderFactory,
  ReaderResolver,
  TikTokAdsReaderFactory
}
import datainsider.jobworker.repository.reader.factory.{
  Ga4ReaderFactory,
  Ga4ServiceAccountReaderFactory,
  ReaderResolver
}
import datainsider.jobworker.repository.{
  DataSourceRepository,
  HttpScheduleRepository,
  HttpSourceRepository,
  ScheduleRepository
}
import datainsider.jobworker.service._
import datainsider.jobworker.service.worker.{VersioningWorker, VersioningWorkerImpl}
import datainsider.jobworker.service.worker2.{FullSyncJobWorker, IncrementalJobWorker, JobWorker2}
import education.x.commons.SsdbKVS
import org.nutz.ssdb4j.SSDBs
import org.nutz.ssdb4j.spi.SSDB

import scala.util.Try

/**
  * Created by SangDang on 9/16/16.
  */
object MainModule extends TwitterModule {
  override def configure: Unit = {
    bindSingleton[WorkerService].to[SimpleWorkerService]
    bindSingleton[ScheduleService].to[ScheduleServiceImpl]
//    bindSingleton[MetadataService].to[MetadataServiceImpl]
    bindSingleton[ScheduleRepository].to[HttpScheduleRepository]
    bindSingleton[DataSourceRepository].to[HttpSourceRepository]
    bindSingleton[VersioningWorker].to[VersioningWorkerImpl]
    bindSingleton[RunnableJobFactory].to[RunnableJobFactoryImpl]
  }

  @Provides
  @Singleton
  @Named("clickhouse")
  def provideClickhouseClient(clickhouseConnSetting: Option[ClickhouseConnectionSetting]): JdbcClient = {
    if (clickhouseConnSetting.isDefined) {
      info(s"Read clickhouse connection setting from env: ${clickhouseConnSetting.get}")

      HikariClient(
        clickhouseConnSetting.get.toJdbcUrl,
        clickhouseConnSetting.get.username,
        clickhouseConnSetting.get.password
      )
    } else {
      val jdbcUrl: String = ZConfig.getString("database_config.clickhouse.url")
      info(s"Read clickhouse connection setting from file: $jdbcUrl")

      val user: String = ZConfig.getString("database_config.clickhouse.username")
      val password: String = ZConfig.getString("database_config.clickhouse.password")
      HikariClient(jdbcUrl, user, password)
    }

  }

  @Provides
  @Singleton
  def provideClickhouseConnectionSetting(): Option[ClickhouseConnectionSetting] = {
    Try {
      require(sys.env("CLICKHOUSE_HOST").nonEmpty, "clickhouse host can not be empty")

      ClickhouseConnectionSetting(
        host = sys.env("CLICKHOUSE_HOST"),
        httpPort = sys.env("CLICKHOUSE_HTTP_PORT").toInt,
        tcpPort = sys.env("CLICKHOUSE_TCP_PORT").toInt,
        username = sys.env("CLICKHOUSE_USERNAME"),
        password = sys.env("CLICKHOUSE_PASSWORD"),
        clusterName = sys.env.getOrElse("CLICKHOUSE_CLUSTER_NAME", "")
      )
    }.toOption
  }

  @Provides
  @Singleton
  def provideDestinationSource: JdbcSource = {
    val url = ZConfig.getString("database_config.clickhouse.url")
    val username = ZConfig.getString("database_config.clickhouse.username")
    val password = ZConfig.getString("database_config.clickhouse.password")
    JdbcSource(
      1,
      1,
      "clickhouse local",
      DatabaseType.MySql,
      url,
      username,
      password
    )
  }

  @Provides
  @Singleton
  def provideHttpClient: HttpClient = {
    val apiHost: String = ZConfig.getString("scheduler_host")
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
    val host: String = ZConfig.getString("database_config.ssdb.host")
    val port: Int = ZConfig.getInt("database_config.ssdb.port")
    val timeout: Int = ZConfig.getInt("database_config.ssdb.timeout_in_ms")
    SSDBs.pool(host, port, timeout, null)
  }

  @Singleton
  @Provides
  def provideSSDBKVS(client: SSDB): SsdbKVS[Long, Boolean] = {
    val dbName: String = ZConfig.getString("database_config.ssdb.db_name")
    SsdbKVS[Long, Boolean](dbName, client)
  }

  @Singleton
  @Provides
  def provideMetaService(dataSourceRepository: DataSourceRepository): MetadataService = {
    val shopifyClientId: String = ZConfig.getString("shopify.client_id")
    val shopifyClientSecret: String = ZConfig.getString("shopify.client_secret")
    new MetadataServiceImpl(dataSourceRepository, shopifyClientId, shopifyClientSecret)
  }

  @Singleton
  @Provides
  def providesReaderResolver(): ReaderResolver = {
    val clientId = ZConfig.getString("google.gg_client_id")
    val clientSecret = ZConfig.getString("google.gg_client_secret")
    val ga4BatchSize = ZConfig.getInt("ga4.batch_size", 10000)
    val appSecret = ZConfig.getString("facebook_ads.app_secret")
    val appId = ZConfig.getString("facebook_ads.app_id")
    val tikTokApiUrl = ZConfig.getString("tiktok_ads.base_url")
    ReaderResolver
      .builder()
      .add(classOf[GoogleServiceAccountSource], classOf[Ga4Job], new Ga4ServiceAccountReaderFactory(ga4BatchSize))
      .add(classOf[Ga4Source], classOf[Ga4Job], new Ga4ReaderFactory(clientId, clientSecret, ga4BatchSize))
      .add(classOf[FacebookAdsSource], classOf[FacebookAdsJob], new FacebookAdsFactory(appSecret, appId))
      .add(classOf[TikTokAdsSource], classOf[TikTokAdsJob], new TikTokAdsReaderFactory(tikTokApiUrl))
      .build()
  }

  @Provides
  def providesJobWorker2(schemaService: SchemaClientService, readerResolver: ReaderResolver): JobWorker2 = {
    val writeBatchSize = ZConfig.getInt("worker_v2.write_batch_size", 5000)
    val reportIntervalSize = ZConfig.getInt("worker_v2.report_interval_size", 100000)
    new IncrementalJobWorker(schemaService, readerResolver, writeBatchSize, reportIntervalSize)
  }

  @Provides
  @Named("FullSyncJobWorker")
  def providesFullSyncJobWorker(
      jobWorker: JobWorker2,
      schemaService: SchemaClientService,
      lakeService: LakeClientService,
      hadoopFileClientService: HadoopFileClientService
  ): JobWorker2 = {
    val fsPath: String = ZConfig.getString("hadoop-writer.hdfs.file_system")
    val baseDir: String = ZConfig.getString("hadoop-writer.base_dir")

    new FullSyncJobWorker(jobWorker, schemaService, lakeService, hadoopFileClientService, fsPath, baseDir)
  }
}
