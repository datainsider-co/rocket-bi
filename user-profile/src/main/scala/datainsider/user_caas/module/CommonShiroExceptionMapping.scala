package datainsider.user_caas.module

import com.google.inject.Singleton
import com.twitter.finagle.http.{Request, Response, Status}
import com.twitter.finatra.http.exceptions.ExceptionMapper
import com.twitter.finatra.http.response.ResponseBuilder
import com.twitter.inject.Logging
import datainsider.client.exception.DIErrorReason
import datainsider.client.module.ApiError
import org.apache.shiro.ShiroException
import org.apache.shiro.authc.IncorrectCredentialsException
import org.apache.shiro.authz.UnauthenticatedException

import javax.inject.Inject

/**
  * @author anhlt
  */
@Singleton
case class CommonShiroExceptionMapping @Inject()(
    response: ResponseBuilder
) extends ExceptionMapper[ShiroException]
    with Logging {

  override def toResponse(request: Request, ex: ShiroException): Response = {
    logError(ex)
    val error = ex match {
      case ex: IncorrectCredentialsException => toApiError(ex)
      case ex: UnauthenticatedException      => toApiError(ex)
      case ex                                => toApiError(ex)
    }
    response.status(error.code).json(error)
  }

  private def logError(ex: Throwable): Unit = {
    logger.error("logError", ex)
  }

  private def toApiError(ex: UnauthenticatedException): ApiError = {
    ApiError(
      Status.Unauthorized.code,
      DIErrorReason.NotAuthenticated,
      ex.getMessage,
      None
    )
  }

  private def toApiError(ex: IncorrectCredentialsException): ApiError = {
    ApiError(
      Status.BadRequest.code,
      DIErrorReason.InvalidCredentials,
      ex.getMessage,
      None
    )
  }

  private def toApiError(ex: Throwable): ApiError = {
    ApiError(
      Status.InternalServerError.code,
      DIErrorReason.InternalError,
      ex.getMessage,
      None
    )
  }
}
