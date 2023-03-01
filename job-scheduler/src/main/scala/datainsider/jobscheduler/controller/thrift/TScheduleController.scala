package datainsider.jobscheduler.controller.thrift

import com.twitter.finatra.thrift.Controller
import com.twitter.scrooge.Response
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.jobscheduler.service.TScheduleService.{DeleteUserData, Ping, Transfer}
import datainsider.jobscheduler.service.{DataSourceService, TScheduleService}
import datainsider.profiler.Profiler

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * created 2023-01-15 2:32 PM
  *
  * @author tvc12 - Thien Vi
  */
class TScheduleController @Inject() (sourceService: DataSourceService)
    extends Controller(TScheduleService)
    with Logging {

  handle(Ping).withFn { request =>
    Future.value(Response("pong"))
  }

  handle(DeleteUserData).withFn { request =>
    Profiler(s"[Thrift] ${getClass.getSimpleName} DeleteUserData") {
      sourceService
        .deleteByOwnerId(request.args.organizationId, request.args.username)
        .rescue {
          case ex: Throwable =>
            logger.error("Delete user data error", ex)
            Future.False
        }
        .map(Response(_))
    }
  }

  handle(Transfer).withFn { request =>
    Profiler(s"[Thrift] ${getClass.getSimpleName} Transfer") {
      sourceService
        .transferOwnerId(request.args.organizationId, request.args.fromUsername, request.args.toUsername)
        .rescue {
          case ex: Throwable =>
            logger.error("Transfer user data error", ex)
            Future.False
        }
        .map(Response(_))
    }
  }
}
