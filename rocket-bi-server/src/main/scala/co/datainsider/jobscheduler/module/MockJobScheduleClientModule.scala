package co.datainsider.jobscheduler.module

import co.datainsider.jobscheduler.client.{MockScheduleClientService, ScheduleClientService}
import com.twitter.inject.TwitterModule

/**
  * created 2023-04-25 10:22 AM
  *
  * @author tvc12 - Thien Vi
  */
object MockJobScheduleClientModule extends TwitterModule {
  override def configure(): Unit = {
    super.configure()
    bindSingleton[ScheduleClientService].to[MockScheduleClientService]
  }
}
