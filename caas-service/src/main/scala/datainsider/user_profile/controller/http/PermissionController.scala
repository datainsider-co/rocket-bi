package datainsider.user_profile.controller.http

import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import datainsider.profiler.Profiler
import datainsider.user_profile.controller.http.request._
import datainsider.user_caas.service.CaasService

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author anhlt
  */
class PermissionController @Inject() (
    caasService: CaasService
) extends Controller
    with Logging {

  private val apiPath = "/user/permissions"

  get(s"$apiPath/me") { request: GetMyPermissionsRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::GetMyPermissionsRequest") {
      val username = request.currentUser.username
      caasService.orgAuthorization().getAllPermissions(request.organizationId, username)
    }
  }

  /**
   * @deprecated("Unused route", since = "2022-07-21")
   */
  post(s"$apiPath/is_permitted") { request: CheckMyPermissionPermittedRequest =>
    Profiler(s"[Http] ${this.getClass.getSimpleName}::CheckMyPermissionPermittedRequest") {
      caasService
        .orgAuthorization()
        .isPermitted(
          request.organizationId,
          request.currentUser.username,
          request.permissions: _*
        )
    }
  }
}
