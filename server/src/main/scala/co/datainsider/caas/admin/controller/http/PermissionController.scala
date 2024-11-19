package co.datainsider.caas.admin.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.license.domain.LicensePermission
import co.datainsider.caas.user_caas.service.OrgAuthorizationService
import co.datainsider.caas.user_profile.controller.http.request._
import co.datainsider.caas.user_profile.util.Configs.enhancePermissions

import javax.inject.Inject

/**
  * @author anhlt
  */
class PermissionController @Inject() (
    orgAuthorizationService: OrgAuthorizationService,
    permissionFilter: PermissionFilter
) extends Controller
    with Logging {
  private lazy val cls = getClass.getSimpleName

  filter(permissionFilter.requireAll("permission:view:[username]", LicensePermission.ViewData))
    .get(s"/admin/permissions/:username") { request: GetAllPermissionsRequest =>
      Profiler(s"/admin/permissions/:username GET") {
        orgAuthorizationService
          .getAllPermissions(request.organizationId, request.username)
      }
    }

  filter(permissionFilter.requireAll("permission:assign:[username]", LicensePermission.EditData))
    .put(s"/admin/permissions/:username/change") { request: ChangePermissionRequest =>
      Profiler(s"/admin/permissions/:username/change")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.User,
        resourceId = request.username,
        description = s"update permissions of user: ${request.username}"
      ) {
        orgAuthorizationService.changePermissions(
          request.organizationId,
          request.username,
          enhancePermissions(request.organizationId, request.includePermissions.toSeq: _*),
          enhancePermissions(request.organizationId, request.excludePermissions.toSeq: _*)
        )
      }
    }

  filter(permissionFilter.requireAll("permission:view:[username]", LicensePermission.ViewData))
    .post(s"/admin/permissions/:username/is_permitted") { request: CheckPermissionPermittedRequest =>
      Profiler(s"/admin/permissions/:username/is_permitted") {
        for {
          isPermittedMap <-
            orgAuthorizationService
              .isPermitted(
                request.getOrganizationId(),
                request.username,
                enhancePermissions(request.getOrganizationId(), request.permissions: _*): _*
              )
        } yield {
          // map permission from client with result from server
          val finalIsPermittedMap: Map[String, Boolean] = request.permissions
            .map(permission => {
              val permissionWithOrgId: String = enhancePermissions(request.getOrganizationId(), permission).head
              permission -> isPermittedMap.getOrElse(permissionWithOrgId, false)
            })
            .toMap
          finalIsPermittedMap
        }
      }
    }

  filter(permissionFilter.requireAll("permission:view:[username]", LicensePermission.ViewData))
    .get(s"/admin/permissions/:username/group") { request: GetUserGroupRequest =>
      Profiler(s"/admin/permissions/:username/group") {
        orgAuthorizationService
          .getUserGroup(request.getOrganizationId(), request.username)
          .map(userGroup => Map("user_group" -> userGroup.toString))
      }
    }

  filter(permissionFilter.requireAll("permission:assign:[username]", LicensePermission.EditData))
    .post(s"/admin/permissions/:username/group") { request: AssignUserGroupRequest =>
      Profiler(s"/admin/permissions/:username/group") {
        orgAuthorizationService
          .assignToGroup(request.getOrganizationId(), request.username, request.userGroup)
          .map(success => Map("success" -> success))
      }
    }

  get(s"/admin/permissions/statistics") { request: GetMyPermissionsRequest =>
    Profiler(s"/admin/permissions/statistics") {
      orgAuthorizationService.getStatistics(request.getOrganizationId())
    }
  }

}
