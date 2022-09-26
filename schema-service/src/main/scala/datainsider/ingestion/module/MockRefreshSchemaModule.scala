package datainsider.ingestion.module

import com.twitter.inject.TwitterModule
import datainsider.ingestion.service.{MockRefreshSchemaWorker, MockSystemService, RefreshSchemaWorker, SystemService};

/**
  * created 2022-08-03 11:36 AM
  *
  * @author tvc12 - Thien Vi
  */
object MockRefreshSchemaModule extends TwitterModule {

  override def configure(): Unit = {
    bindSingleton[RefreshSchemaWorker].to[MockRefreshSchemaWorker]
    bindSingleton[SystemService].to[MockSystemService]
  }
}
