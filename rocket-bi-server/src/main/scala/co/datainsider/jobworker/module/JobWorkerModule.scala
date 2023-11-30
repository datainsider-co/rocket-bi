package co.datainsider.jobworker.module

import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.client.{HttpClient, HttpClientImpl}
import co.datainsider.jobworker.domain.job._
import co.datainsider.jobworker.domain.source._
import co.datainsider.jobworker.repository.reader.facebook_ads.FacebookAdsFactory
import co.datainsider.jobworker.repository.reader.factory._
import co.datainsider.jobworker.repository.reader.googlesearchconsole.SearchConsoleReaderFactory
import co.datainsider.jobworker.repository.reader.lazada.LazadaReaderFactory
import co.datainsider.jobworker.repository.reader.mixpanel.MixpanelReaderFactory
import co.datainsider.jobworker.repository.reader.palexy.PalexyReaderFactory
import co.datainsider.jobworker.repository.reader.shopee.ShopeeReaderFactory
import co.datainsider.jobworker.repository.{DataSourceRepository, HttpScheduleRepository, HttpSourceRepository, ScheduleRepository}
import co.datainsider.jobworker.service.{RunnableJobFactory, _}
import co.datainsider.jobworker.service.jobprogress._
import co.datainsider.jobworker.service.worker.{VersioningWorker, VersioningWorkerImpl}
import co.datainsider.jobworker.service.worker2.{FullSyncJobWorker, JobWorker2, JobWorker2Impl}
import co.datainsider.jobworker.util.GoogleOAuthConfig
import co.datainsider.schema.client.SchemaClientService
import com.google.inject.name.Named
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.{Injector, TwitterModule}
import education.x.commons.{KVS, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB

/**
  * Created by SangDang on 9/16/16.
  */
object JobWorkerModule extends TwitterModule {

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
  def provideHttpClient: HttpClient = {
    val apiHost: String = ZConfig.getString("jobworker.scheduler_host")
    new HttpClientImpl(apiHost)
  }

  @Singleton
  @Provides
  @Named("job_in_queue")
  def provideSSDBKVS(client: SSDB): KVS[Long, Boolean] = {
    val dbName: String = ZConfig.getString("schedule_service.db_name")
    SsdbKVS[Long, Boolean](dbName, client)
  }

  @Singleton
  @Provides
  def provideMetaService(dataSourceRepository: DataSourceRepository): MetadataService = {
    val shopifyClientId: String = ZConfig.getString("shopify.client_id")
    val shopifyClientSecret: String = ZConfig.getString("shopify.client_secret")
    val googleOAuthConfig = GoogleOAuthConfig(
      clientId = ZConfig.getString("google.gg_client_id"),
      clientSecret = ZConfig.getString("google.gg_client_secret"),
      redirectUri = ZConfig.getString("google.redirect_uri"),
      serverEncodedUrl = ZConfig.getString("google.server_encoded_url")
    )
    new MetadataServiceImpl(dataSourceRepository, shopifyClientId, shopifyClientSecret, googleOAuthConfig)
  }

  @Singleton
  @Provides
  def providesReaderResolver(): ReaderResolver = {
    // gg
    val clientId = ZConfig.getString("google.gg_client_id")
    val clientSecret = ZConfig.getString("google.gg_client_secret")
    // ga4
    val ga4BatchSize = ZConfig.getInt("ga4.batch_size", 10000)
    // fb
    val fbAppSecret = ZConfig.getString("facebook_ads.app_secret")
    val fbAppId = ZConfig.getString("facebook_ads.app_id")
    // tiktok
    val tikTokApiUrl = ZConfig.getString("tiktok_ads.base_url")
    // palexy
    val palexyApiUrl = ZConfig.getString("palexy.base_url", "https://ica.palexy.com")
    val palexyWindowDays = ZConfig.getInt("palexy.window_days", 30)
    val palexyRetryTimes = ZConfig.getInt("palexy.retry_times", 3)
    val palexyRetryIntervalMs = ZConfig.getInt("palexy.retry_interval_ms", 1000)
    ReaderResolver
      .builder()
      .add(classOf[GoogleServiceAccountSource], classOf[Ga4Job], new Ga4ServiceAccountReaderFactory(ga4BatchSize))
      .add(classOf[Ga4Source], classOf[Ga4Job], new Ga4ReaderFactory(clientId, clientSecret, ga4BatchSize))
      .add(classOf[MockDataSource], classOf[GaJob], new OldGaReaderFactory(createGaReaderFactory()))
      .add(classOf[GaSource], classOf[GaJob], createGaReaderFactory())
      .add(classOf[FacebookAdsSource], classOf[FacebookAdsJob], new FacebookAdsFactory(fbAppSecret, fbAppId))
      .add(classOf[TikTokAdsSource], classOf[TikTokAdsJob], new TikTokAdsReaderFactory(tikTokApiUrl))
      .add(classOf[ShopeeSource], classOf[ShopeeJob], createShopeeFactory())
      .add(classOf[LazadaSource], classOf[LazadaJob], new LazadaReaderFactory)
      .add(classOf[PalexySource], classOf[PalexyJob], new PalexyReaderFactory(palexyApiUrl, palexyWindowDays, palexyRetryTimes, palexyRetryIntervalMs))
      .add(classOf[GoogleSearchConsoleSource], classOf[GoogleSearchConsoleJob], createSearchConsoleReaderFactory())
      .add(classOf[MixpanelSource], classOf[MixpanelJob], new MixpanelReaderFactory())
      .build()
  }


  private def createShopeeFactory(): ReaderFactory[ShopeeSource, ShopeeJob] = {
    val apiUrl: String = ZConfig.getString("shopee.api_url")
    val partnerId: String = ZConfig.getString("shopee.partner_id")
    val partnerKey: String = ZConfig.getString("shopee.partner_key")
    new ShopeeReaderFactory(apiUrl, partnerId, partnerKey)
  }

  private def createGaReaderFactory(): ReaderFactory[GaSource, GaJob] = {
    new GaReaderFactory(
      googleOAuthConfig = getOAuthConfig(),
      applicationName =  ZConfig.getString("google.application_name", "Data Insider"),
      connTimeoutMs = ZConfig.getInt("google.connection_timeout_ms", 300000), //default: 5ms
      readTimeoutMs = ZConfig.getInt("google.read_timeout_ms", 300000),
      batchSize = ZConfig.getInt("google.batch_size", 100000)
    )
  }

  private def getOAuthConfig(): GoogleOAuthConfig = {
    GoogleOAuthConfig(
      clientId = ZConfig.getString("google.gg_client_id"),
      clientSecret = ZConfig.getString("google.gg_client_secret"),
      redirectUri = ZConfig.getString("google.redirect_uri"),
      serverEncodedUrl = ZConfig.getString("google.server_encoded_url")
    )
  }

  private def createSearchConsoleReaderFactory(): SearchConsoleReaderFactory = {
    new SearchConsoleReaderFactory(
      googleOAuthConfig = getOAuthConfig(),
      applicationName =  ZConfig.getString("google.application_name", "Data Insider"),
      connTimeoutMs = ZConfig.getInt("google.connection_timeout_ms", 300000), //default: 5ms
      readTimeoutMs = ZConfig.getInt("google.read_timeout_ms", 300000),
    )
  }

  @Provides
  def providesJobWorker2(engineResolver: EngineResolver, schemaService: SchemaClientService, readerResolver: ReaderResolver): JobWorker2 = {
    val writeBatchSize = ZConfig.getInt("worker_v2.write_batch_size", 5000)
    val reportIntervalSize = ZConfig.getInt("worker_v2.report_interval_size", 100000)
    new JobWorker2Impl(engineResolver, schemaService, readerResolver, writeBatchSize, reportIntervalSize)
  }

  @Provides
  @Named("FullSyncJobWorker")
  def providesFullSyncJobWorker(
      jobWorker: JobWorker2,
      schemaService: SchemaClientService
  ): JobWorker2 = {
    new FullSyncJobWorker(jobWorker, schemaService)
  }

  @Provides
  @Singleton
  def providesJobProgressFactoryResolver(): JobProgressFactoryResolver = {
    JobProgressFactoryResolver
      .builder()
      .add(classOf[GaJob], new GaProgressFactory())
      .add(classOf[Ga4Job], new Ga4ProgressFactory())
      .add(classOf[FacebookAdsJob], new FacebookAdsProgressFactory())
      .add(classOf[TikTokAdsJob], new TikTokAdsProgressFactory())
      .add(classOf[ShopeeJob], new ShopeeProgressFactory())
      .add(classOf[LazadaJob], new LazadaProgressFactory())
      .add(classOf[PalexyJob], new PalexyProgressFactory())
      .add(classOf[GoogleSearchConsoleJob], new GoogleSearchConsoleProgressFactory())
      .build()
  }
}
