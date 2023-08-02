package co.datainsider.caas.user_profile.controller.http

import co.datainsider.bi.util.profiler.Profiler
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import co.datainsider.caas.user_profile.controller.http.request._
import co.datainsider.caas.user_caas.service.CaasService

import javax.inject.Inject

/**
  * @author anhlt
  */
class PermissionController @Inject() (
    caasService: CaasService
) extends Controller
    with Logging {

  get("/user/permissions/me") { request: GetMyPermissionsRequest =>
    Profiler(s"/user/permissions/me") {
      val username = request.currentUser.username
      caasService.orgAuthorization().getAllPermissions(request.organizationId, username)
    }
  }

  /**
    * @deprecated("Unused route", since = "2022-07-21")
    */
  post("/user/permissions/is_permitted") { request: CheckMyPermissionPermittedRequest =>
    Profiler(s"/user/permissions/is_permitted") {
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
