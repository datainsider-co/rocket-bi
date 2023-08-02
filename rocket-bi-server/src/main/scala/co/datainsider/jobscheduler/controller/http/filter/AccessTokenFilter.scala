package co.datainsider.jobscheduler.controller.http.filter

import com.google.inject.name.Named
import com.google.inject.{Inject, Singleton}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import org.apache.shiro.authz.UnauthorizedException

@Singleton
class AccessTokenFilter @Inject() (@Named("access-token") accessToken: String) extends SimpleFilter[Request, Response] {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    request.headerMap.get("access-token") match {
      case Some(token) =>
        if (accessToken == token) service(request)
        else throw new UnauthorizedException("unauthorized access")
      case None => throw new UnauthorizedException("unauthorized access")
    }
  }
}
