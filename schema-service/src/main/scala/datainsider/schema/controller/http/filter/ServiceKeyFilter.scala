package datainsider.schema.controller.http.filter

import com.google.inject.Inject
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.UnAuthorizedError

import javax.inject.{Named, Singleton}

@Singleton
class ServiceKeyFilter @Inject() (@Named("service_key") serviceKey: String)
    extends SimpleFilter[Request, Response]
    with Logging {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val requestServiceKey = request.headerMap.getOrElse("DI-SERVICE-KEY", "")
    if (requestServiceKey == serviceKey) {
      service(request)
    } else {
      Future.exception(UnAuthorizedError(s"The service key is invalid or missing."))
    }
  }
}
