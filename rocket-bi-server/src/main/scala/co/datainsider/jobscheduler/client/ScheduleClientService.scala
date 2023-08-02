package co.datainsider.jobscheduler.client

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.jobscheduler.service.DataSourceService
import com.twitter.util.Future
import com.twitter.util.logging.Logging

import javax.inject.Inject

/**
  * created 2023-01-15 2:17 PM
  *
  * @author tvc12 - Thien Vi
  */
trait ScheduleClientService {
  def deleteUserData(orgId: Long, username: String): Future[Boolean]

  def transfer(orgId: Long, fromUsername: String, toUsername: String): Future[Boolean]
}

class ScheduleClientServiceImpl @Inject() (sourceService: DataSourceService)
    extends ScheduleClientService
    with Logging {
  override def deleteUserData(orgId: Long, username: String): Future[Boolean] =
    Profiler(s"${getClass.getSimpleName} deleteUserData") {
      sourceService
        .deleteByOwnerId(orgId, username)
        .rescue {
          case ex: Throwable => {
            logger.error(s"deleteUserData:: failed cause ${ex.getMessage}", ex)
            Future.False
          }
        }
    }

  override def transfer(orgId: Long, fromUsername: String, toUsername: String): Future[Boolean] =
    Profiler(s"${getClass.getSimpleName} Transfer") {
      sourceService
        .transferOwnerId(orgId, fromUsername, toUsername)
        .rescue {
          case ex: Throwable => {
            logger.error(s"transfer:: failed cause ${ex.getMessage}", ex)
            Future.False
          }
        }
    }
}

class MockScheduleClientService() extends ScheduleClientService {
  override def deleteUserData(orgId: Long, username: String): Future[Boolean] = Future.True

  override def transfer(orgId: Long, fromUsername: String, toUsername: String): Future[Boolean] = Future.True
}
