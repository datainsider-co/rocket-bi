package co.datainsider.bi.controller.http.filter

import co.datainsider.bi.util.Implicits.RichOption
import co.datainsider.common.client.exception.BadRequestError
import co.datainsider.common.client.util.Implicits.ImplicitRequestLike
import com.google.inject.name.Named
import com.google.inject.{Inject, Singleton}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import org.apache.shiro.authz.UnauthorizedException

@Singleton
class AccessTokenFilter @Inject() (@Named("access-token") accessToken: String) extends SimpleFilter[Request, Response] {

  private val ACCESS_TOKEN_KEY = "access-token"

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val fromToken: String = getAccessToken(request)
    if (fromToken.equals(accessToken)) {
      service(request)
    } else {
      Future.exception(new UnauthorizedException("Invalid access token"))
    }
  }

  private def getAccessToken(request: Request): String = {
    request
      .getFromHeader(ACCESS_TOKEN_KEY)
      .orElse(request.getFromQuery(ACCESS_TOKEN_KEY))
      .getOrElseThrow(new BadRequestError("Missing access token"))
  }
}
