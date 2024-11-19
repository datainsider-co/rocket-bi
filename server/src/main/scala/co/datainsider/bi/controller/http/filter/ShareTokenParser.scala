package co.datainsider.bi.controller.http.filter

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.client.OrgClientService
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.{UserAuthField, UserContextSyntax}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.domain.user.{LoginResponse, SessionInfo, UserInfo, UserProfile}

import javax.inject.{Inject, Named}
import scala.concurrent.ExecutionContext.Implicits.global

/** *
  * Tạo user từ token
  * Nếu đã có user rồi, thì không cần parser
  * Nếu không token thì bỏ qua
  */
class ShareTokenParser @Inject() (
    orgClientService: OrgClientService,
    @Named("token_header_key") tokenKey: String
) extends SimpleFilter[Request, Response]
    with Logging {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] =
    Profiler("[Parser ShareTokenParser]::apply") {
      for {
        _ <- injectShareUser(request).rescue {
          case ex: Throwable =>
            logger.error("Error when inject share user", ex)
            Future.Unit
        }
        response <- service(request)
      } yield response
    }

  private def injectShareUser(request: Request): Future[Unit] = {
    val domain: String = request.getRequestDomain()
    val token: Option[String] = request.headerMap.get(tokenKey)
    if (token.isDefined && request.ctx(UserAuthField).isEmpty) {
      logger.debug("injectShareUser:: need to inject share user")
      for {
        organization <- orgClientService.getWithDomain(domain)
        loginResponse = ShareTokenParser.getLoginResponse(token.get, organization)
      } yield request.ctx.update(UserAuthField, Option(loginResponse))
    } else {
      logger.debug("injectShareUser:: don't need to inject share user")
      Future.Unit
    }
  }
}

object ShareTokenParser {
  def getAnonymousSession(tokenId: String): SessionInfo =
    SessionInfo(
      key = "ssid",
      value = s"token_$tokenId",
      domain = ".datainsider.co",
      maxAgeInMs = 1629303213482L,
      createdAt = None,
      path = "/"
    )
  def getAnonymousUserInfo(organization: Organization): UserInfo =
    UserInfo(
      username = getAnonymousUserProfile().username,
      roles = Seq.empty,
      isActive = true,
      createdTime = 1598195240844L,
      organization = Some(organization),
      permissions = Set.empty
    )
  def getAnonymousUserProfile(): UserProfile =
    UserProfile(
      username = "anonymous-a224c078-5aae-41ca-8b2f-16315803b5ff",
      fullName = Some("anonymous user"),
      email = Some("anonymous-user-a224c078-5aae-41ca-8b2f-16315803b5ff@datainsider.co")
    )
  def getLoginResponse(tokenId: String, organization: Organization): LoginResponse = {
    LoginResponse(getAnonymousSession(tokenId), getAnonymousUserInfo(organization), Some(getAnonymousUserProfile()))
  }
}
