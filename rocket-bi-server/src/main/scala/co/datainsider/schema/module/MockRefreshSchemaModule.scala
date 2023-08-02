package co.datainsider.schema.module

import co.datainsider.schema.service.{MockRefreshSchemaService, RefreshSchemaService}
import com.twitter.inject.TwitterModule;

/**
  * created 2022-08-03 11:36 AM
  *
  * @author tvc12 - Thien Vi
  */
object MockRefreshSchemaModule extends TwitterModule {
  override def configure(): Unit = {
    bindSingleton[RefreshSchemaService].to[MockRefreshSchemaService]
  }
}
