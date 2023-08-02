package co.datainsider.caas.user_caas.service

import co.datainsider.caas.user_profile.controller.http.filter.parser.UserSessionResolver
import com.twitter.finagle.http.Request
import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import datainsider.client.domain.Implicits.RichOptionString
import co.datainsider.caas.user_profile.domain.user.LoginResponse
import co.datainsider.caas.user_profile.service.AuthService

import javax.inject.Inject

/**
  * This implementation will use a local authen service
  * instead of using a thrift client (DefaultUserSessionResolver) connect back to this service's thrift server.
  * @see CustomCaasClientModule
  * @param authService
  */
case class CustomUserSessionResolver @Inject() (
    authService: AuthService
) extends UserSessionResolver
    with Logging {

  override def resolveUser(request: Request): Future[Option[LoginResponse]] = {
    getSessionId(request) match {
      case Some(sessionId) => checkSession(sessionId)
      case _               => Future.None
    }
  }

  private def getSessionId(request: Request): Option[String] = {

    val authCookie = request.cookies.get("ssid").map(_.value).notNullOrEmpty
    val authHeader = request.headerMap.get("Authorization").notNullOrEmpty

    if (authCookie.isDefined) authCookie else authHeader
  }

  private def checkSession(sessionId: String): Future[Option[LoginResponse]] = {
    authService
      .checkSession(sessionId)
      .transform {
        case Return(r) => Future.value(Option(r))
        case Throw(e) =>
          error(s"checkSession($sessionId)", e)
          Future.None
      }
  }
}
