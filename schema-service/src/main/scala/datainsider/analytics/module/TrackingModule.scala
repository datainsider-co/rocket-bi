package datainsider.analytics.module

import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule
import datainsider.analytics.repository._
import datainsider.analytics.service.tracking._
import datainsider.analytics.service.{TrackingSchemaService, TrackingSchemaServiceImpl}
import datainsider.ingestion.repository._
import org.nutz.ssdb4j.spi.SSDB

object TrackingModule extends TwitterModule {

  override def configure(): Unit = {
    super.configure()
    bind[TrackingSchemaMerger].to[TrackingSchemaMergerImpl].asEagerSingleton()
    bind[TrackingSchemaService].to[TrackingSchemaServiceImpl].asEagerSingleton()
    bind[ApiKeyService].to[ApiKeyServiceImpl].asEagerSingleton()
  }

  @Singleton
  @Provides
  def providesTrackingSchemaRepository(
      schemaRepository: SchemaRepository
  ): TrackingSchemaRepository = {
    TrackingSchemaRepositoryImpl(
      schemaRepository
    )
  }

  @Singleton
  @Provides
  def providesApiKeyRepository(client: SSDB): ApiKeyRepository = {
    new ApiKeyRepositoryWithCache(SSDBApiKeyRepository(client))
  }

  @Singleton
  @Provides
  def providesApiKeyGenerator(): ApiKeyGenerator = DefaultApiKeyGenerator()

}
