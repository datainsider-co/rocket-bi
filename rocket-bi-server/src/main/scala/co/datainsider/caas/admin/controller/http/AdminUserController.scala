package co.datainsider.caas.admin.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import co.datainsider.caas.user_profile.controller.http.request.RegisterRequest
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import co.datainsider.caas.admin.controller.http.request._
import co.datainsider.caas.admin.service.AdminUserService
import co.datainsider.caas.user_profile.controller.http.filter.DataRequestContext.MainRequestContextSyntax
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.controller.http.filter.{MustLoggedInFilter, PermissionFilter}
import co.datainsider.license.domain.LicensePermission
import co.datainsider.caas.user_profile.controller.http.filter.email.EmailShouldNotExistFilter
import co.datainsider.caas.user_profile.controller.http.filter.parser.RegisterRequestBodyParser
import co.datainsider.caas.user_profile.controller.http.request._
import co.datainsider.caas.user_profile.service.{RegistrationService, UserProfileService}

import javax.inject.Inject

/**
  * @author anhlt
  */
class AdminUserController @Inject() (
    registrationService: RegistrationService,
    userAdminService: AdminUserService,
    profileService: UserProfileService,
    permissionFilter: PermissionFilter
) extends Controller
    with Logging {

  filter(permissionFilter.requireAll("user:create:*", LicensePermission.EditData))
    .filter[RegisterRequestBodyParser]
    .filter[EmailShouldNotExistFilter]
    .filter[MustLoggedInFilter]
    .post("/admin/users/create") { request: Request =>
      Profiler(s"/admin/users/create") {
        UserActivityTracker(
          request = request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Create,
          resourceType = ResourceType.User,
          resourceId = "",
          description = s"create new user"
        ) {
          val registerRequest = request
            .requestData[RegisterRequest]
            .copy(isVerifyEnabled = Some(false))
          registrationService.register(request.getOrganizationId(), registerRequest)
        }
      }
    }

  filter(permissionFilter.requireAll("user:view:[username]", LicensePermission.ViewData))
    .get("/admin/users/:username") { request: GetUserDetailRequest =>
      Profiler(s"/admin/users/:username GET") {
        userAdminService.getUserFullDetail(request.organizationId, request.username)
      }
    }

  filter(permissionFilter.requireAll("user:edit:[username]", LicensePermission.EditData))
    .put("/admin/users/:username") { request: EditProfileRequest =>
      Profiler(s"/admin/users/:username PUT") {
        val username = request.request.getParam("username")
        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Update,
          resourceType = ResourceType.User,
          resourceId = username,
          description = s"update profile user ${username}"
        ) {
          profileService.updateProfile(request.getOrganizationId(), username, request)
        }
      }
    }

  filter(permissionFilter.requireAll("user:edit:[username]", LicensePermission.EditData))
    .put("/admin/users/:username/property") { request: EditUserPropertyRequest =>
      Profiler(s"/admin/users/:username/property PUT") {
        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Update,
          resourceType = ResourceType.User,
          resourceId = request.username,
          description = s"update properties user ${request.username}"
        ) {
          userAdminService.updateUserProperties(
            request.getOrganizationId(),
            request.username,
            request.properties,
            request.deletedPropertyKeys
          )
        }
      }
    }

  filter(permissionFilter.requireAll("user:suspend:[username]", LicensePermission.EditData))
    .post("/admin/users/:username/activate") { request: ActivateRequest =>
      Profiler(s"/admin/users/:username/activate") {
        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Update,
          resourceType = ResourceType.User,
          resourceId = request.username,
          description = s"activate user ${request.username}"
        ) {
          userAdminService.activate(request.getOrganizationId(), request.username)
        }
      }
    }

  filter(permissionFilter.requireAll("user:suspend:[username]", LicensePermission.EditData))
    .post("/admin/users/:username/deactivate") { request: DeactivateRequest =>
      Profiler(s"/admin/users/:username/deactivate") {
        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Update,
          resourceType = ResourceType.User,
          resourceId = request.username,
          description = s"deactivate user ${request.username}"
        ) {
          userAdminService.deactivate(request.getOrganizationId(), request.username)
        }
      }
    }

  filter(permissionFilter.requireAll("user:view:*", LicensePermission.ViewData))
    .post("/admin/users/search") { request: SearchUserRequest =>
      Profiler(s"/admin/users/search") {
        userAdminService.searchUsers(
          request.getOrganizationId(),
          request.isActive,
          request.from.getOrElse(0),
          request.size.getOrElse(20)
        )
      }
    }

  filter(permissionFilter.requireAll("user:view:*", LicensePermission.ViewData))
    .post("/admin/users/search/v2") { request: SearchUserRequest =>
      Profiler(s"/admin/users/search/v2") {
        userAdminService.searchUsersV2(
          request.getOrganizationId(),
          request.keyword,
          request.from.getOrElse(0),
          request.size.getOrElse(20),
          request.userType
        )
      }
    }

  filter(permissionFilter.requireAll("user:delete:[username]", LicensePermission.EditData))
    .delete("/admin/users/:username/delete") { request: DeleteUserRequest =>
      Profiler(s"/admin/users/:username/delete") {
        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Delete,
          resourceType = ResourceType.User,
          resourceId = request.username,
          description = s"delete user ${request.username}"
        ) {
          userAdminService
            .delete(request.getOrganizationId(), request.username, request.transferToEmail)
            .map(isSuccess => Map("isSuccess" -> isSuccess))
        }
      }
    }

  filter(permissionFilter.requireAll("user:reset_password:[username]", LicensePermission.EditData))
    .put("/admin/users/:username/reset_password") { request: ResetPasswordRequest =>
      Profiler(s"/admin/users/:username/reset_password") {
        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Update,
          resourceType = ResourceType.User,
          resourceId = request.username,
          description = s"reset password user ${request.username}"
        ) {
          userAdminService
            .resetPassword(request.getOrganizationId(), request.username)
            .map(isSuccess => Map("is_success" -> isSuccess))
        }
      }
    }
}
