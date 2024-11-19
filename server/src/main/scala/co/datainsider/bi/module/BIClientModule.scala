package co.datainsider.bi.module

import co.datainsider.bi.client.{BIClientService, BIClientServiceImpl, MockBIClientService}
import co.datainsider.bi.domain.ClickhouseConnection
import co.datainsider.bi.service.EngineService
import co.datainsider.bi.util.ZConfig
import co.datainsider.schema.client._
import co.datainsider.schema.service.{IngestionService, IngestionServiceImpl, MockIngestionService, SchemaService}
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule

/**
  * created 2023-12-13 3:37 PM
  *
  * @author tvc12 - Thien Vi
  */
object BIClientModule extends TwitterModule {
  override def configure(): Unit = {
    bind[BIClientService].to[BIClientServiceImpl]
  }

  @Singleton
  @Provides
  def providesSchemaClientService(schemaService: SchemaService): SchemaClientService = {
    new SchemaClientServiceWithCache(SchemaClientServiceImpl(schemaService))
  }

  @Singleton
  @Provides
  def provideIngestionService(
      client: SchemaClientService,
      engineService: EngineService
  ): IngestionService = {
    IngestionServiceImpl(
      schemaService = client,
      engineService = engineService,
      batchSize = ZConfig.getInt("data_cook.insert_batch_size", 100000)
    )
  }
}

object TestBIClientModule extends TwitterModule {
  override def configure(): Unit = {
    bind[SchemaClientService].to[MockSchemaClientService].asEagerSingleton()
    bind[IngestionService].to[MockIngestionService].asEagerSingleton()
  }

  @Singleton
  @Provides
  private def providesBIClientService(clickhouse: ClickhouseConnection): BIClientService = {
    new MockBIClientService(clickhouse)
  }
}

object MockBIClientModule extends TwitterModule {
  override def configure(): Unit = {
    bind[SchemaClientService].to[MockSchemaClientService].asEagerSingleton()
    bind[IngestionService].to[MockIngestionService].asEagerSingleton()
  }

  @Singleton
  @Provides
  private def providesBIClientService(): BIClientService = {
    new MockBIClientService(
      ClickhouseConnection(
        orgId = 0,
        host = "localhost",
        username = "default",
        password = "default",
        httpPort = 8123,
        tcpPort = 9000
      )
    )
  }
}
