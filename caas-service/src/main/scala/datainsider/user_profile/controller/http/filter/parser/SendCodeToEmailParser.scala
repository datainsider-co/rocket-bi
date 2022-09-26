package datainsider.user_profile.controller.http.filter.parser

import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import datainsider.client.filter.DataRequestContext
import datainsider.profiler.Profiler
import datainsider.user_profile.controller.http.filter.email.EmailContextRequest
import datainsider.user_profile.util.JsonParser

import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author anhlt
  */
class SendCodeToEmailParser extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] =
    Profiler(s"[Filter] ${this.getClass.getSimpleName}::apply") {
      val sendCodeRequest = JsonParser.fromJson[SendCodeToEmailRequest](request.contentString)
      DataRequestContext.setDataRequest(request, sendCodeRequest)
      service(request)
    }
}

class VerifyRegistrationRequestParser extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] =
    Profiler(s"[Filter] ${this.getClass.getSimpleName}::apply") {
      val verifyRequest = JsonParser.fromJson[VerifyRegistrationRequest](request.contentString)
      DataRequestContext.setDataRequest(request, verifyRequest)
      service(request)
    }
}

class ResetPasswordRequestParser extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] =
    Profiler(s"[Filter] ${this.getClass.getSimpleName}::apply") {
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
