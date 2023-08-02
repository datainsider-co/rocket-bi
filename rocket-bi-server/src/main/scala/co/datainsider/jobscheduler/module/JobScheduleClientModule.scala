package co.datainsider.jobscheduler.module

import co.datainsider.jobscheduler.client.{ScheduleClientService, ScheduleClientServiceImpl}
import com.twitter.inject.TwitterModule

/**
  * created 2023-04-25 10:22 AM
  *
  * @author tvc12 - Thien Vi
  */
object JobScheduleClientModule extends TwitterModule {
  override def configure(): Unit = {
    super.configure()
    bindSingleton[ScheduleClientService].to[ScheduleClientServiceImpl]
  }
}
