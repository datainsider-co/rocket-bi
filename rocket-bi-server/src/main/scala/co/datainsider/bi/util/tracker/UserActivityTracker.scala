package co.datainsider.bi.util.tracker

import co.datainsider.bi.util.Serializer
import co.datainsider.bi.util.tracker.ActionType.ActionType
import co.datainsider.bi.util.tracker.ResourceType.ResourceType
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import com.google.inject.Singleton
import com.twitter.finagle.http.Request
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.{BadRequestError, DIException}

trait UserActivityTracker {
  def apply[T](f: => T): T

  def apply[T](f: => Future[T]): Future[T]
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
      resourceId: String,
      description: String
  ): UserActivityTracker = {
    new UserActivityTracker {

      override def apply[T](f: => T): T = {
        val t1: Long = System.currentTimeMillis()

        try {
          val resp: T = f
          track(
            startTime = t1,
            endTime = System.currentTimeMillis(),
            request = request,
            jsonResponse = Serializer.toJson(resp),
            actionName = actionName,
            actionType = actionType,
            resourceType = resourceType,
            resourceId = resourceId,
            message = description,
            statusCode = SUCCESS_CODE
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
              resourceId,
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
              resourceId,
              description,
              ERROR_CODE
            )
            throw ex
        }
      }

      override def apply[T](f: => Future[T]): Future[T] = {
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
            resourceId,
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
              resourceId,
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
              resourceId,
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
      resourceId: String,
      message: String,
      statusCode: Int
  ): Unit = {

    try {
      val (orgId, email) = getAuthInfo(request)
      val responseContent = if (jsonResponse.length > 1000) "<too_long>" else jsonResponse

      UserActivityTrackingClient.track(
        UserActivityEvent(
          timestamp = startTime,
          orgId = orgId,
          username = email,
          actionName = actionName,
          actionType = actionType,
          resourceType = resourceType,
          resourceId = resourceId,
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
          execTimeMs = endTime - startTime,
          message = message
        )
      )
    } catch {
      case ex: Throwable => error(s"${this.getClass.getSimpleName}::track fail with exception: $ex")
    }

  }

  private def getAuthInfo(request: Request): (Long, String) = {
    if (request.isAuthenticated) {
      (request.currentOrganizationId.get, request.currentProfile.get.email.get)
    } else throw BadRequestError(s"failed to get auth info for request: ${request.toString()}")
  }

}
