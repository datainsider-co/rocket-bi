package datainsider.jobworker.module

import com.google.inject.name.Named
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import datainsider.client.service.{HadoopFileClientService, LakeClientService, SchemaClientService}
import datainsider.jobworker.domain.GoogleServiceAccountSource
import datainsider.jobworker.domain.job.{FacebookAdsJob, Ga4Job}
import datainsider.jobworker.domain.source.{FacebookAdsSource, Ga4Source}
import datainsider.jobworker.repository.reader.facebook_ads.FacebookAdsFactory
import datainsider.jobworker.repository.reader.factory.{
  Ga4ReaderFactory,
  Ga4ServiceAccountReaderFactory,
  ReaderResolver
}
import datainsider.jobworker.service.worker2.{FullSyncJobWorker, IncrementalJobWorker, JobWorker2}
import datainsider.jobworker.service.{RunnableJobFactory, RunnableJobFactoryImpl}
import datainsider.jobworker.util.ZConfig

object JobWorkerTestModule extends TwitterModule {
  override def configure(): Unit = {
    super.configure()
    bindSingleton[RunnableJobFactory].to[RunnableJobFactoryImpl]
  }

  @Singleton
  @Provides
  def providesReaderResolver(): ReaderResolver = {
    val clientId = ZConfig.getString("google.gg_client_id")
    val clientSecret = ZConfig.getString("google.gg_client_secret")
    val ga4BatchSize = ZConfig.getInt("ga4.batch_size", 10000)
    val appSecret = ZConfig.getString("facebook_ads.app_secret")
    val appId = ZConfig.getString("facebook_ads.app_id")
    ReaderResolver
      .builder()
      .add(classOf[GoogleServiceAccountSource], classOf[Ga4Job], new Ga4ServiceAccountReaderFactory(ga4BatchSize))
      .add(classOf[Ga4Source], classOf[Ga4Job], new Ga4ReaderFactory(clientId, clientSecret, ga4BatchSize))
      .add(classOf[FacebookAdsSource], classOf[FacebookAdsJob], new FacebookAdsFactory(appSecret, appId))
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
