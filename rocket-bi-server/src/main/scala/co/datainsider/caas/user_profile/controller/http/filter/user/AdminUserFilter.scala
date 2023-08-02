package co.datainsider.caas.user_profile.controller.http.filter.user

import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import com.twitter.finagle.http.Request
import com.twitter.util.Future
import datainsider.client.domain.permission.{PermissionResult, Permitted, UnPermitted}
import datainsider.client.filter.BaseAccessFilter
import datainsider.client.filter.BaseAccessFilter.AccessValidator

import javax.inject.Singleton

/**
  * @author tvc12 - Thien Vi
  * @created 03/15/2021 - 12:10 PM
  */
@Singleton
case class AdminUserFilter() extends BaseAccessFilter {
  def isAdminFilter(request: Request): Future[PermissionResult] = {
    if (request.isAuthenticated) {
      request.headerMap.get("s-key") match {
        case Some(data) if (data.equals("tvc12@datainsider.co")) => Future.value(Permitted())
        case _                                                   => Future.value(UnPermitted("Nani?"))
      }
    } else {
      Future.value(UnPermitted("Nani?"))
    }
  }
  override protected def getValidatorChain(): Seq[AccessValidator] = Seq(isAdminFilter)
}
