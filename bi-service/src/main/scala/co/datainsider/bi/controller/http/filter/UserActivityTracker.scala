package co.datainsider.bi.controller.http.filter

import co.datainsider.bi.domain.query.event.ActionType.ActionType
import co.datainsider.bi.domain.query.event.ResourceType.ResourceType
import co.datainsider.bi.domain.query.event.UserActivityEvent
import co.datainsider.bi.util.Serializer
import com.google.inject.Singleton
import com.twitter.finagle.http.Request
import com.twitter.inject.Logging
import com.twitter.util.{Future => TwitterFuture}
import datainsider.client.exception.DIException
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.util.TrackingClient

import scala.concurrent.{ExecutionContext, Future => ScalaFuture}
import scala.util.{Failure, Success}

trait UserActivityTracker {
  def apply[T](f: => T)(implicit ec: ExecutionContext): T

  def apply[T](f: => ScalaFuture[T])(implicit ec: ExecutionContext): ScalaFuture[T]

  def apply[T](f: => TwitterFuture[T])(implicit ec: ExecutionContext): TwitterFuture[T]
}

@Singleton
object UserActivityTracker extends Logging {

  val SUCCESS_CODE: Int = 200
  val ERROR_CODE: Int = 500

  def apply(
      request: Request,
      actionName: String,
      actionType: ActionType,
      resourceType: ResourceType,
      description: String
  ): UserActivityTracker = {
    new UserActivityTracker {

      override def apply[T](f: => T)(implicit ec: ExecutionContext): T = {
        val t1: Long = System.currentTimeMillis()

        try {
          val resp: T = f
          track(
            t1,
            System.currentTimeMillis(),
            request,
            Serializer.toJson(resp),
            actionName,
            actionType,
            resourceType,
            description,
            SUCCESS_CODE
          )
          resp
        } catch {
          case ex: DIException =>
            track(
              t1,
              System.currentTimeMillis(),
              request,
              ex.getMessage,
              actionName,
              actionType,
              resourceType,
              description,
              ex.getStatus.code
            )
            throw ex
          case ex: Throwable =>
            track(
              t1,
              System.currentTimeMillis(),
              request,
              ex.getMessage,
              actionName,
              actionType,
              resourceType,
              description,
              ERROR_CODE
            )
            throw ex
        }
      }

      override def apply[T](f: => ScalaFuture[T])(implicit ec: ExecutionContext): ScalaFuture[T] = {
        val startTime: Long = System.currentTimeMillis()

        f.onComplete {
          case Failure(exception) =>
            exception match {
              case ex: DIException =>
                track(
                  startTime,
                  System.currentTimeMillis(),
                  request,
                  ex.getMessage,
                  actionName,
                  actionType,
                  resourceType,
                  description,
                  ex.getStatus.code
                )
              case ex: Throwable =>
                track(
                  startTime,
                  System.currentTimeMillis(),
                  request,
                  ex.getMessage,
                  actionName,
                  actionType,
                  resourceType,
                  description,
                  ERROR_CODE
                )
            }

          case Success(resp) =>
            track(
              startTime,
              System.currentTimeMillis(),
              request,
              Serializer.toJson(resp),
              actionName,
              actionType,
              resourceType,
              description,
              SUCCESS_CODE
            )
        }

        f
      }

      override def apply[T](f: => TwitterFuture[T])(implicit ec: ExecutionContext): TwitterFuture[T] = {
        val startTime = System.currentTimeMillis()

        f.onSuccess(resp =>
          track(
            startTime = startTime,
            endTime = System.currentTimeMillis(),
            request = request,
            jsonResponse = Serializer.toJson(resp),
            actionName = actionName,
            actionType: ActionType,
            resourceType: ResourceType,
            message = description,
            statusCode = SUCCESS_CODE
          )
        ).rescue {
          case ex: DIException =>
            track(
              startTime,
              System.currentTimeMillis(),
              request,
              ex.getMessage,
              actionName,
              actionType,
              resourceType,
              description,
              ex.getStatus.code
            )
            throw ex
          case ex: Throwable =>
            track(
              startTime,
              System.currentTimeMillis(),
              request,
              ex.getMessage,
              actionName,
              actionType,
              resourceType,
              description,
              ERROR_CODE
            )
            throw ex
        }

      }

    }
  }

  private def track(
      startTime: Long,
      endTime: Long,
      request: Request,
      jsonResponse: String,
      actionName: String,
      actionType: ActionType,
      resourceType: ResourceType,
      message: String,
      statusCode: Int
  ): Unit = {

    try {
      val (orgId, username) = getAuthInfo(request)
      val responseContent = if (jsonResponse.length > 300) "<too_long>" else jsonResponse

      TrackingClient.track(
        UserActivityEvent(
          timestamp = startTime,
          orgId = orgId,
          username = username,
          actionName = actionName,
          actionType = actionType,
          resourceType = resourceType,
          remoteHost = request.headerMap.get("Host").getOrElse("<null>"),
          remoteAddress = request.headerMap.get("X-Real-IP").getOrElse("<null>"),
          method = request.method.toString(),
          path = request.path,
          param = request.params.toString(),
          statusCode = statusCode,
          requestSize = request.getContentString().getBytes().length,
          requestContent = request.getContentString(),
          responseSize = jsonResponse.getBytes().length,
          responseContent = responseContent,
          executionTime = endTime - startTime,
          message = message
        )
      )
    } catch {
      case ex: Throwable => error(s"${this.getClass.getSimpleName}::track fail with exception: $ex")
    }

  }

  private def getAuthInfo(request: Request): (Long, String) = {
    if (request.isAuthenticated) {
      (request.currentOrganizationId.get, request.currentUsername)
    } else {
      (-1L, "<null>")
    }
  }

}
