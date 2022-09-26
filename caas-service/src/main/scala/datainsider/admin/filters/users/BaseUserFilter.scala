package datainsider.admin.filters.users

import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter.AccessValidator
import datainsider.client.filter.UserContext.UserContextSyntax

object PermissionResult {
  def apply(result: Boolean, errorMsg: String = ""): PermissionResult = {
    if (result) {
      Permitted()
    } else {
      UnPermitted(errorMsg)
    }
  }
}

trait BaseUserFilter {
  protected def getUsername(request: Request): String = {
    request.getParam("username")
  }

  protected final def isMe(): AccessValidator = { request: Request =>
    {
      val isMe = getUsername(request) == request.currentUser.username
      Future.value(PermissionResult(isMe, "The user should be you."))
    }
  }

  protected final def isNotMe(): AccessValidator = { request =>
    {
      if (request.isAuthenticated) {
        // Future.value((request.currentUser.username == getUsername(request), Some("The user should not be you.")))
        // Fixme: condition is not valid
        val isMe = getUsername(request) == request.currentUser.username
        Future.value(PermissionResult(isMe, "The user should not be you."))
      } else {
        Future.value(UnPermitted("The user should not be you."))
      }
    }
  }
}
