package co.datainsider.common.client.filter

import co.datainsider.common.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import co.datainsider.common.client.exception.{InternalError, UnAuthorizedError}
import co.datainsider.common.client.filter.BaseAccessFilter.AccessValidator
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future

object BaseAccessFilter {
  type AccessValidator = Request => Future[PermissionResult]
}

abstract class BaseAccessFilter extends SimpleFilter[Request, Response] {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    isPermitted(request).flatMap {
      case _: Permitted => service(request)
      case permissionResult: UnPermitted =>
        Future.exception(
          UnAuthorizedError(
            s"You should have one of these following permissions to perform:\n\t+${permissionResult.errorMsg}"
          )
        )
      case _ => Future.exception(InternalError("Permitted error"))
    }
  }

  final protected def isPermitted(request: Request): Future[PermissionResult] = {
    val funcList: Seq[AccessValidator] = getValidatorChain()

    funcList.foldLeft[Future[PermissionResult]](Future.value(UnPermitted(""))) { (previousResult, func) =>
      previousResult.flatMap {
        case previousPermissionResult: Permitted => Future.value(previousPermissionResult)
        case previousPermissionResult: UnPermitted =>
          func(request).map(permissionResult => collectErrorMsgUnPermitted(permissionResult, previousPermissionResult))
      }
    }
  }

  private def collectErrorMsgUnPermitted(
      permissionResult: PermissionResult,
      previousPermissionResult: UnPermitted
  ): PermissionResult = {
    permissionResult match {
      case _: Permitted => permissionResult
      case permissionResult: UnPermitted =>
        val errorMsg = s"${previousPermissionResult.errorMsg}\n\t${permissionResult.errorMsg}"
        UnPermitted(errorMsg)
    }
  }

  /**
    * Set your validators here
    * @return
    */
  protected def getValidatorChain(): Seq[AccessValidator]
}


