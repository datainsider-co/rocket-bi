package co.datainsider.jobworker.module

import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.util.ZConfig
import co.datainsider.jobworker.client.{HttpClient, HttpClientImpl}
import co.datainsider.jobworker.domain.job._
import co.datainsider.jobworker.domain.source._
import co.datainsider.jobworker.module.JobWorkerModule.{bindSingleton, createSearchConsoleReaderFactory}
import co.datainsider.jobworker.repository.reader.facebook_ads.FacebookAdsFactory
import co.datainsider.jobworker.repository.reader.factory._
import co.datainsider.jobworker.repository.reader.googlesearchconsole.SearchConsoleReaderFactory
import co.datainsider.jobworker.repository.reader.lazada.LazadaReaderFactory
import co.datainsider.jobworker.repository.reader.palexy.PalexyReaderFactory
import co.datainsider.jobworker.repository.reader.shopee.ShopeeReaderFactory
import co.datainsider.jobworker.repository.{DataSourceRepository, HttpScheduleRepository, MockHttpSourceRepository, ScheduleRepository}
import co.datainsider.jobworker.service.jobprogress._
import co.datainsider.jobworker.service.worker2.{FullSyncJobWorker, JobWorker2, JobWorker2Impl}
import co.datainsider.jobworker.service._
import co.datainsider.jobworker.service.worker.{VersioningWorker, VersioningWorkerImpl}
import co.datainsider.jobworker.util.{GoogleOAuthConfig, InsertMockData}
import co.datainsider.schema.client.SchemaClientService
import com.amazonaws.services.s3.{AmazonS3, AmazonS3ClientBuilder}
import com.google.inject.Provides
import com.google.inject.name.Named
import com.twitter.inject.{Injector, TwitterModule}
import datainsider.notification.service.{MockNotificationService, NotificationService}
import education.x.commons.{KVS, SsdbKVS}
import org.nutz.ssdb4j.spi.SSDB
import org.testcontainers.containers.localstack.LocalStackContainer
import org.testcontainers.containers.localstack.LocalStackContainer.Service
import org.testcontainers.utility.DockerImageName

import java.io.File
import javax.inject.Singleton

object JobWorkerTestModule extends TwitterModule {
  override def configure: Unit = {
    //bindSingleton[ScheduleService].to[ScheduleServiceImpl]
    bindSingleton[ScheduleRepository].to[HttpScheduleRepository]
    bindSingleton[DataSourceRepository].to[MockHttpSourceRepository]
    bindSingleton[NotificationService].to[MockNotificationService]
    bindSingleton[RunnableJobFactory].to[RunnableJobFactoryImpl]
    bindSingleton[WorkerService].to[MockWorkerService]
    bindSingleton[VersioningWorker].to[VersioningWorkerImpl]
  }

  override def singletonPostWarmupComplete(injector: Injector): Unit = {
    super.singletonPostWarmupComplete(injector)
    insertMysqlMockData()
    insertMssqlMockData()
    insertPostgresMockData()
  }

  @Provides
  @Singleton
  def provideHttpClient: HttpClient = {
    val apiHost: String = ZConfig.getString("jobworker.scheduler_host")
    new HttpClientImpl(apiHost)
  }

  @Singleton
  @Provides
  @Named("access-token")
  def provideAccessToken(): String = {
    ZConfig.getString("schedule_service.access_token", "job$cheduler@datainsider.co")
  }

  @Singleton
  @Provides
  @Named("job_in_queue")
  def provideSSDBKVS(client: SSDB): KVS[Long, Boolean] = {
    val dbName: String = ZConfig.getString("schedule_service.db_name")
    SsdbKVS[Long, Boolean](dbName, client)
  }

  private def insertMysqlMockData(): Unit = {
    val jdbcUrl: String = ZConfig.getString("test_db.mysql.url")
    val username: String = ZConfig.getString("test_db.mysql.username")
    val password: String = ZConfig.getString("test_db.mysql.password")
    InsertMockData.insertMysqlMockData(jdbcUrl, username, password)
  }

  private def insertMssqlMockData(): Unit = {
    val jdbcUrl: String = ZConfig.getString("test_db.mssql.url")
    val username: String = ZConfig.getString("test_db.mssql.username")
    val password: String = ZConfig.getString("test_db.mssql.password")
    InsertMockData.insertMssqlMockData(jdbcUrl, username, password)
  }

  private def insertPostgresMockData(): Unit = {
    val jdbcUrl: String = ZConfig.getString("test_db.postgres.url")
    val username: String = ZConfig.getString("test_db.postgres.username")
    val password: String = ZConfig.getString("test_db.postgres.password")
    InsertMockData.insertPostgresMockData(jdbcUrl, username, password)
  }

  @Provides
  @Singleton
  def provideS3Client(): AmazonS3 = {
    val localstackImage: DockerImageName = DockerImageName.parse("localstack/localstack:0.14.2")
    val localstack: LocalStackContainer = new LocalStackContainer(localstackImage)
    localstack.withServices(Service.S3)
    localstack.start()

    val s3Client: AmazonS3 = AmazonS3ClientBuilder
      .standard()
      .withEndpointConfiguration(localstack.getEndpointConfiguration(Service.S3))
      .withCredentials(localstack.getDefaultCredentialsProvider)
      .build()

    val bucketName = "products"
    val fileKey = "products.csv"
    val filePath = getClass.getClassLoader.getResource("datasets/jobworker/products.csv").getFile

    s3Client.createBucket(bucketName)
    s3Client.putObject(bucketName, fileKey, new File(filePath))

    s3Client
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
    val clientId = ZConfig.getString("google.gg_client_id")
    val clientSecret = ZConfig.getString("google.gg_client_secret")
    val ga4BatchSize = ZConfig.getInt("ga4.batch_size", 10000)
    val appSecret = ZConfig.getString("facebook_ads.app_secret")
    val appId = ZConfig.getString("facebook_ads.app_id")
    val palexyApiUrl = ZConfig.getString("palexy.base_url", "https://ica.palexy.com")

    ReaderResolver
      .builder()
      .add(classOf[GoogleServiceAccountSource], classOf[Ga4Job], new Ga4ServiceAccountReaderFactory(ga4BatchSize))
      .add(classOf[Ga4Source], classOf[Ga4Job], new Ga4ReaderFactory(clientId, clientSecret, ga4BatchSize))
      .add(classOf[GaSource], classOf[GaJob], createGaReaderFactory())
      .add(classOf[MockDataSource], classOf[GaJob], new OldGaReaderFactory(createGaReaderFactory()))
      .add(classOf[FacebookAdsSource], classOf[FacebookAdsJob], new FacebookAdsFactory(appSecret, appId))
      .add(classOf[ShopeeSource], classOf[ShopeeJob], createShopeeReaderFactory())
      .add(classOf[LazadaSource], classOf[LazadaJob], new LazadaReaderFactory)
      .add(classOf[PalexySource], classOf[PalexyJob], new PalexyReaderFactory(palexyApiUrl))
      .add(classOf[GoogleSearchConsoleSource], classOf[GoogleSearchConsoleJob], createSearchConsoleReaderFactory())
      .build()
  }

  private def createShopeeReaderFactory(): ReaderFactory[ShopeeSource, ShopeeJob] = {
    val apiUrl: String = ZConfig.getString("shopee.api_url")
    val partnerId: String = ZConfig.getString("shopee.partner_id")
    val partnerKey: String = ZConfig.getString("shopee.partner_key")
    new ShopeeReaderFactory(apiUrl, partnerId, partnerKey)
  }

  private def createGaReaderFactory(): ReaderFactory[GaSource, GaJob] = {
    new GaReaderFactory(
      googleOAuthConfig = getOAuthConfig(),
      applicationName = ZConfig.getString("google.application_name", "Data Insider"),
      connTimeoutMs = ZConfig.getInt("google.connection_timeout_ms", 300000),
      readTimeoutMs = ZConfig.getInt("google.read_timeout_ms", 300000), //default: 5ms,
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
      applicationName = ZConfig.getString("google.application_name", "Data Insider"),
      connTimeoutMs = ZConfig.getInt("google.connection_timeout_ms", 300000),
      readTimeoutMs = ZConfig.getInt("google.read_timeout_ms", 300000)
    )
  }

  @Provides
  def providesJobWorker2(
      engineResolver: EngineResolver,
      schemaService: SchemaClientService,
      readerResolver: ReaderResolver
  ): JobWorker2 = {
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
