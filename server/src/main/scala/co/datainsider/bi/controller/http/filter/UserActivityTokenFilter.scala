package co.datainsider.bi.controller.http.filter

import co.datainsider.bi.util.ZConfig
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.util.Future
import co.datainsider.common.client.exception.BadRequestError

class UserActivityTokenFilter extends SimpleFilter[Request, Response] {
  private val secretToken = ZConfig.getString("user_activity_token_filter.secret_token", "user_activity@bi_service")

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    if (!request.headerMap.contains("secret_token")) {
      return Future.exception(BadRequestError("missing secret token"))
    }

    if (request.headerMap("secret_token") != secretToken) {
      return Future.exception(BadRequestError("invalid secret token"))
    }

    service(request)
  }
}
