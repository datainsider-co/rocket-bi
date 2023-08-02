package co.datainsider.schema.module

import co.datainsider.schema.client.{
  MockSchemaClientService,
  SchemaClientService,
  SchemaClientServiceImpl,
  SchemaClientServiceWithCache
}
import co.datainsider.schema.service.SchemaService
import com.google.inject.Provides
import com.twitter.inject.TwitterModule

import javax.inject.Singleton

/**
  * created 2023-04-24 5:38 PM
  *
  * @author tvc12 - Thien Vi
  */
object SchemaClientModule extends TwitterModule {
  @Singleton
  @Provides
  def providesSchemaClientService(schemaService: SchemaService): SchemaClientService = {
    new SchemaClientServiceWithCache(SchemaClientServiceImpl(schemaService))
  }
}

object MockSchemaClientModule extends TwitterModule {

  override def configure(): Unit = {
    super.configure()
    bindSingleton[SchemaClientService].to[MockSchemaClientService]
  }

}
