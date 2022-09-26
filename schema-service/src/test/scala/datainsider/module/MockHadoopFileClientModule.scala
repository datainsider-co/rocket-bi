package datainsider.module

import com.twitter.inject.TwitterModule
import datainsider.client.service.HadoopFileClientService
import datainsider.ingestion.service.MockHadoopFileClientService

object MockHadoopFileClientModule extends TwitterModule {
  override def configure(): Unit = {
    bindSingleton[HadoopFileClientService].to[MockHadoopFileClientService]
  }
}
