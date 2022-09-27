package datainsider.schema.module

import com.twitter.inject.TwitterModule
import datainsider.client.service.HadoopFileClientService
import datainsider.schema.service.MockHadoopFileClientService
import datainsider.schema.service.MockHadoopFileClientService

object MockHadoopFileClientModule extends TwitterModule {
  override def configure(): Unit = {
    bindSingleton[HadoopFileClientService].to[MockHadoopFileClientService]
  }
}
