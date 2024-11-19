package co.datainsider.caas.user_profile.controller.http.filter.parser

import co.datainsider.caas.user_profile.controller.http.filter.DataRequestContext
import co.datainsider.caas.user_profile.controller.http.filter.parser.OrganizationContext.OrganizationContextSyntax
import co.datainsider.caas.user_profile.controller.http.request.{LoginByEmailPassRequest, LoginByUserPassRequest}
import co.datainsider.caas.user_profile.service.UserProfileService
import co.datainsider.caas.user_profile.util.JsonParser
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.inject.Logging
import com.twitter.util.Future
import co.datainsider.common.client.exception.InvalidCredentialError

import javax.inject.Inject

/**
  * @author anhlt
  */
class LoginRequestParser @Inject() (
    profileService: UserProfileService
) extends SimpleFilter[Request, Response]
    with Logging {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val orgId: Long = request.orgId
    val loginByEmailReq = JsonParser.fromJson[LoginByEmailPassRequest](request.contentString)
    getUsernameByEmail(orgId, loginByEmailReq.email)
      .map(username => setLoginRequestToContext(request, username, loginByEmailReq.password))
      .flatMap(_ => service(request))
  }

  private def getUsernameByEmail(organizationId: Long, email: String): Future[String] = {
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
