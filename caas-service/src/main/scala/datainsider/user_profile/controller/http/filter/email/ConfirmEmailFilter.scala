package datainsider.user_profile.controller.http.filter.email

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import datainsider.client.exception.{EmailNotExistedError, EmailVerificationRequiredError, UnAuthorizedError}
import datainsider.client.filter.DataRequestContext.MainRequestContextSyntax
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.user_profile.service.UserProfileService

import javax.inject.Inject

/**
  * @author anhlt
  */

trait ConfirmEmailFilterRequest {
  def getUsername(): String
}

class ConfirmEmailFilter @Inject() (profileService: UserProfileService) extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val confirmEmailFilterRequest = request.requestData[ConfirmEmailFilterRequest]
    val organizationId = request.currentOrganizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }
    profileService.isConfirmEmail(organizationId, confirmEmailFilterRequest.getUsername()).flatMap {
      case false => Future.exception(EmailVerificationRequiredError("You have to verify your email."))
      case _     => service(request)
    }
  }
}

class NotConfirmEmailFilter @Inject() (profileService: UserProfileService) extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val emailRequest: ConfirmEmailFilterRequest = request.requestData
    val organizationId = request.currentOrganizationId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found organization id")
    }
    profileService.isConfirmEmail(organizationId, emailRequest.getUsername()).flatMap {
      case false => service(request)
      case _     => Future.exception(EmailNotExistedError())
    }
  }
}
