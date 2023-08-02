package co.datainsider.bi.controller.http.filter

import co.datainsider.bi.module.ApiError
import com.fasterxml.jackson.core.JsonParseException
import com.google.inject.Singleton
import com.twitter.finagle.http.{Request, Response, Status}
import com.twitter.finatra.http.exceptions.ExceptionMapper
import com.twitter.finatra.http.response.ResponseBuilder
import com.twitter.finatra.jackson.caseclass.exceptions.CaseClassMappingException
import com.twitter.inject.Logging
import datainsider.client.exception.{DIErrorReason, DIException}

import javax.inject.Inject
import scala.util.Try

/**
  * @author anhlt
  */
@Singleton
class CommonExceptionMapping @Inject() (
    response: ResponseBuilder
) extends ExceptionMapper[Throwable]
    with Logging {
  override def toResponse(request: Request, ex: Throwable): Response = {
    logError(ex)
    val error = ex match {
      case e: DIException =>
        ApiError(
          e.getStatus.code,
          e.reason,
          e.getMessage,
          Try(e.getCause.getMessage).toOption
        )
      case _ =>
        ApiError(
          Status.InternalServerError.code,
          DIErrorReason.InternalError,
          ex.getMessage,
          None
        )
    }
    response.status(error.code).json(error)
  }
  private def logError(ex: Throwable): Unit = {
    error(s"${ex.getClass.getName}: ${ex.getMessage}", ex)
  }
}

@Singleton
class CaseClassExceptionMapping @Inject() (
    response: ResponseBuilder
) extends ExceptionMapper[CaseClassMappingException]
    with Logging {
  override def toResponse(request: Request, throwable: CaseClassMappingException): Response = {
    error("", throwable)
    response.badRequest.json(
      ApiError(
        Status.BadRequest.code,
        reason = "invalid_param",
        throwable.errors.head.getMessage
      )
    )
  }
}
@Singleton
class JsonParseExceptionMapping @Inject() (
    response: ResponseBuilder
) extends ExceptionMapper[JsonParseException]
    with Logging {
  override def toResponse(request: Request, ex: JsonParseException): Response = {
    error(s"JsonParseExceptionMapping: ${ex.getMessage}", ex)
    response.badRequest.json(
      ApiError(
        Status.BadRequest.code,
        reason = "invalaid_json_format",
        ex.getMessage
      )
    )
  }
}
