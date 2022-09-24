package datainsider.admin.controller.http

import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import datainsider.client.filter.PermissionFilter
import datainsider.profiler.Profiler
import datainsider.user_caas.service.OrgAuthorizationService
import datainsider.user_profile.controller.http.request._
import datainsider.user_profile.util.Configs.enhancePermissions

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author anhlt
  */
class PermissionController @Inject() (
    orgAuthorizationService: OrgAuthorizationService,
    permissionFilter: PermissionFilter
) extends Controller
    with Logging {
  private lazy val cls = getClass.getSimpleName

  filter(permissionFilter.require("permission:view:[username]"))
    .get(s"/admin/permissions/:username") { request: GetAllPermissionsRequest =>
      Profiler(s"[AdminUser] $cls::GetAllPermissions") {
        orgAuthorizationService
          .getAllPermissions(request.organizationId, request.username)
      }
    }

  filter(permissionFilter.require("permission:assign:[username]"))
    .put(s"/admin/permissions/:username/change") { request: ChangePermissionRequest =>
      Profiler(s"[AdminUser] $cls::ChangePermissions") {
        orgAuthorizationService.changePermissions(
          request.organizationId,
          request.username,
          enhancePermissions(request.organizationId, request.includePermissions.toSeq: _*),
          enhancePermissions(request.organizationId, request.excludePermissions.toSeq: _*)
        )
      }
    }

  filter(permissionFilter.require("permission:view:[username]"))
    .post(s"/admin/permissions/:username/is_permitted") { request: CheckPermissionPermittedRequest =>
      Profiler(s"[AdminUser] $cls::IsPermitted") {
        for {
          isPermittedMap <- orgAuthorizationService
              .isPermitted(
                request.getOrganizationId(),
                request.username,
                enhancePermissions(request.getOrganizationId(), request.permissions: _*): _*
              )
        } yield {
          // map permission from client with result from server
          val finalIsPermittedMap: Map[String, Boolean] = request.permissions.map(permission => {
            val permissionWithOrgId: String = enhancePermissions(request.getOrganizationId(), permission).head
            permission -> isPermittedMap.getOrElse(permissionWithOrgId, false)
          }).toMap
          finalIsPermittedMap
        }
      }
    }


}
