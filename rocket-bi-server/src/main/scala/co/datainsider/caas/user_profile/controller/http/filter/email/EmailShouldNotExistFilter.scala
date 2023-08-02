package co.datainsider.caas.user_profile.controller.http.filter.email

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import datainsider.client.exception.{EmailExistedError, EmailNotExistedError, UnAuthorizedError}
import co.datainsider.caas.user_profile.controller.http.filter.DataRequestContext.MainRequestContextSyntax
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.controller.http.filter.parser.OrganizationContext.OrganizationContextSyntax
import co.datainsider.caas.user_profile.service.UserProfileService

import javax.inject.Inject

/**
  * @author anhlt
  */

trait EmailContextRequest {
  def getEmail(): String
}

class EmailShouldNotExistFilter @Inject() (
    profileService: UserProfileService
) extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val emailRequest: EmailContextRequest = request.requestData
    val organizationId = request.currentOrganizationId.getOrElse(request.orgId)

    profileService.isProfileByEmailExisted(organizationId, emailRequest.getEmail()).flatMap {
      case false => service(request)
      case _     => Future.exception(EmailExistedError(s"The email is already existed: ${emailRequest.getEmail()}"))
    }
  }
}

class EmailMustExistFilter @Inject() (
    profileService: UserProfileService
) extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val emailRequest: EmailContextRequest = request.requestData
    val organizationId = request.currentOrganizationId.getOrElse(request.orgId)

    profileService.isProfileByEmailExisted(organizationId, emailRequest.getEmail()).flatMap {
      case true  => service(request)
      case false => Future.exception(EmailNotExistedError())
    }
  }
}
