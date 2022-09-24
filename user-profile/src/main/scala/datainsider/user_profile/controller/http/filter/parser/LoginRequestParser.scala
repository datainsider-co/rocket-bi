package datainsider.user_profile.controller.http.filter.parser

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.exception.InvalidCredentialError
import datainsider.client.filter.DataRequestContext
import datainsider.profiler.Profiler
import datainsider.user_profile.controller.http.filter.parser.OrganizationContext.OrganizationContextSyntax
import datainsider.user_profile.controller.http.request.{LoginByEmailPassRequest, LoginByUserPassRequest}
import datainsider.user_profile.service.{OrganizationService, UserProfileService}
import datainsider.user_profile.util.JsonParser

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author anhlt
  */
class LoginRequestParser @Inject() (
    profileService: UserProfileService
) extends SimpleFilter[Request, Response]
    with Logging {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] =
    Profiler(s"[Filter] ${this.getClass.getSimpleName}::apply") {
      val orgId: Long = request.orgId
      val loginByEmailReq = JsonParser.fromJson[LoginByEmailPassRequest](request.contentString)
      getUsernameByEmail(orgId, loginByEmailReq.email)
        .map(username => setLoginRequestToContext(request, username, loginByEmailReq.password))
        .flatMap(_ => service(request))
    }

  private def getUsernameByEmail(organizationId: Long, email: String): Future[String] =
    Profiler(s"[Filter] ${this.getClass.getSimpleName}::getUsernameByEmail") {
      profileService.getUserProfileByEmail(organizationId, email).map(_.username).rescue {
        case ex: Exception =>
          error("getUsernameByEmail", ex)
          Future.exception(InvalidCredentialError("your credentials is not found: email"))
      }
    }

  private def setLoginRequestToContext(request: Request, username: String, password: String): Unit = {
    DataRequestContext.setDataRequest(
      request,
      LoginByUserPassRequest(username, password)
    )
  }

}
