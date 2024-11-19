package co.datainsider.bi.controller.http.filter

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import co.datainsider.common.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import co.datainsider.common.client.exception.UnAuthorizedError

trait PermissionValidator {
  def isPermitted(request: Request): Future[PermissionResult]
}

/**
  * created 2022-11-26 5:05 PM
  *
  * @author tvc12 - Thien Vi
  */
case class OrFilter(validators: PermissionValidator*) extends SimpleFilter[Request, Response] with Logging {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    isPermitted(request).flatMap {
      case _: Permitted   => service(request)
      case _: UnPermitted => Future.exception(UnAuthorizedError("You do not have permissions to perform this action!"))
    }
  }

  protected def isPermitted(request: Request): Future[PermissionResult] = {
    validators.foldLeft[Future[PermissionResult]](Future.value(UnPermitted(""))) { (previousResult, validator) =>
      previousResult.flatMap {
        case previousResult: Permitted => Future.value(previousResult)
        case _: UnPermitted =>
          validator.isPermitted(request).transform {
            case Return(permissionResult) => Future.value(permissionResult)
            case Throw(ex) =>
              logger.error(s"Error when check permission: ${ex.getMessage}", ex)
              Future.value(UnPermitted(s"Error when check permission cause ${ex.getMessage}"))
          }
      }
    }
  }
}
