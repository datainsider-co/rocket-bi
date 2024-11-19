package co.datainsider.bi.controller.http.filter

import co.datainsider.bi.domain.DirectoryType
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.share.service.ShareService
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import com.twitter.util.logging.Logging

import javax.inject.{Inject, Named}

/**
  * created 2022-11-27 8:56 PM
  *
  * @author tvc12 - Thien Vi
  */
class InviteToDirectoryFilter @Inject() (
    shareService: ShareService,
    @Named("token_header_key") tokenKey: String
) extends SimpleFilter[Request, Response]
    with Logging {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    for {
      _ <- inviteToDirectory(request).rescue {
        case ex: Throwable => {
          logger.error(s"Error when invite to directory: ${ex.getMessage}", ex)
          Future.Unit
        }
      }
      response <- service(request)
    } yield response
  }

  private def inviteToDirectory(request: Request): Future[Unit] = {
    val directoryId: String = request.getParam("id")
    request.headerMap.get(tokenKey) match {
      case Some(token) =>
        shareService
          .invite(
            request.currentOrganizationId.get,
            DirectoryType.Directory.toString,
            directoryId,
            Seq(request.currentUsername),
            token
          )
          .unit
      case _ => Future.Unit
    }
  }
}
