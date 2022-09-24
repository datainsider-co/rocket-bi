package datainsider.ingestion.controller.http.filter

import com.google.inject.Inject
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.exception.UnAuthorizedError
import datainsider.ingestion.util.Implicits.ImplicitRequestLike

import javax.inject.{Named, Singleton}

@Singleton
class AdminSecretKeyFilter @Inject() (
    @Named("admin_secret_key") adminSecretKey: String
) extends SimpleFilter[Request, Response]
    with Logging {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val adminSecret: String = request.getQueryOrBodyParam("admin_secret_key")
    adminSecret.equals(adminSecretKey) match {
      case true => service(request)
      case _ =>
        Future.exception(
          UnAuthorizedError("You're not allowed to access this. Admin Secret Key required: (admin_secret_key)")
        )
    }
  }
}
