package datainsider.ingestion.controller.http.filter

import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.util.Future
import datainsider.client.exception.BadRequestError
import datainsider.client.util.ZConfig
import datainsider.ingestion.util.Implicits.ImplicitRequestLike

class ApiKeyFilter extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val apiKey = request.getQueryOrBodyParam("api_key")
    for {
      _ <- verify(apiKey)
      r <- service(request)
    } yield r
  }

  /**
    *
    * @param apiKey api key to verify
    * @return throw error if invalid api key
    */
  private def verify(apiKey: String): Future[Unit] =
    Future {
      // TODO: improve with apiKeyService here
      val hardcodedKey = ZConfig.getString("file_sync.default_api_key")
      if (apiKey != hardcodedKey) throw BadRequestError("invalid api key")
    }

}
