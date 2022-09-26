package datainsider.analytics.controller.http.filters

import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.exception.UnAuthorizedError

case class UpdateProfileRightFilter() extends SimpleFilter[Request, Response] with Logging {

  override def apply(request: Request, service: Service[Request, Response]) = {
    if (isPermitted(request)) {
      service(request)
    } else {
      Future.exception(UnAuthorizedError(s"You have no permission to update this profile information."))
    }
  }

  private def isPermitted(request: Request): Boolean = {
    val editingUserId = Option(request.getParam("user_id", null))
    editingUserId.exists(_ == request.currentUser.username)
  }

}
