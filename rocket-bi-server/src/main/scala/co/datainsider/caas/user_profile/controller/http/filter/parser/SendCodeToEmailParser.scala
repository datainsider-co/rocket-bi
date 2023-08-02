package co.datainsider.caas.user_profile.controller.http.filter.parser

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import co.datainsider.caas.user_profile.controller.http.filter.DataRequestContext
import co.datainsider.caas.user_profile.controller.http.filter.email.EmailContextRequest
import co.datainsider.caas.user_profile.util.JsonParser
import com.twitter.finatra.http.annotations.RouteParam

/**
  * @author anhlt
  */
class SendCodeToEmailParser extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val sendCodeRequest = JsonParser.fromJson[SendCodeToEmailRequest](request.contentString)
    DataRequestContext.setDataRequest(request, sendCodeRequest)
    service(request)
  }
}

class VerifyRegistrationRequestParser extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val verifyRequest = JsonParser.fromJson[VerifyRegistrationRequest](request.contentString)
    DataRequestContext.setDataRequest(request, verifyRequest)
    service(request)
  }
}

class ResetPasswordRequestParser extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val resetPasswordRequest = JsonParser.fromJson[ResetPasswordRequest](request.contentString)
    DataRequestContext.setDataRequest(request, resetPasswordRequest)
    service(request)
  }
}

case class SendCodeToEmailRequest(email: String) extends EmailContextRequest {
  override def getEmail(): String = email
}

case class ResetPasswordRequest(email: String, newPassword: String, verifyCode: String) extends EmailContextRequest {
  override def getEmail(): String = email
}

case class VerifyRegistrationRequest(email: String, verifyCode: String) extends EmailContextRequest {
  override def getEmail(): String = email
}

case class VerifyCodeRequest(email: String, @RouteParam code: String) extends EmailContextRequest {
  override def getEmail(): String = email
}
