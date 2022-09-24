package datainsider.admin.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import datainsider.admin.controller.http.request._
import datainsider.admin.service.AdminUserService
import datainsider.client.filter.DataRequestContext.MainRequestContextSyntax
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.client.filter.{MustLoggedInFilter, PermissionFilter}
import datainsider.profiler.Profiler
import datainsider.user_profile.controller.http.filter.email.EmailShouldNotExistFilter
import datainsider.user_profile.controller.http.filter.parser.RegisterRequestBodyParser
import datainsider.user_profile.controller.http.request._
import datainsider.user_profile.service.{RegistrationService, UserProfileService}

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author anhlt
  */
class AdminUserController @Inject()(
    registrationService: RegistrationService,
    userAdminService: AdminUserService,
    profileService: UserProfileService,
    permissionFilter: PermissionFilter
) extends Controller
    with Logging {

  filter(permissionFilter.require("user:create:*"))
    .filter[RegisterRequestBodyParser]
    .filter[EmailShouldNotExistFilter]
    .filter[MustLoggedInFilter]
    .post("/admin/users/create") { request: Request =>
      Profiler(s"[AdminUser] ${this.getClass.getSimpleName}::register") {
        val registerRequest = request
          .requestData[RegisterRequest]
          .copy(isVerifyEnabled = Some(false))
        registrationService.register(request.getOrganizationId(), registerRequest)
      }
    }

  filter(permissionFilter.require("user:view:[username]"))
    .get("/admin/users/:username") { request: GetUserDetailRequest =>
      Profiler(s"[AdminUser] ${this.getClass.getSimpleName}::GetUserDetailRequest") {
        userAdminService.getUserFullDetail(request.organizationId, request.username)
      }
    }

  filter(permissionFilter.require("user:edit:[username]"))
    .put("/admin/users/:username") { request: EditProfileRequest =>
      Profiler(s"[AdminUser] ${this.getClass.getSimpleName}::EditProfileRequest") {
        val username = request.request.getParam("username")
        profileService.updateProfile(request.getOrganizationId(), username, request)
      }
    }

  filter(permissionFilter.require("user:edit:[username]"))
    .put("/admin/users/:username/property") { request: EditUserPropertyRequest =>
      Profiler(s"[AdminUser] ${this.getClass.getSimpleName}::EditUserPropertyRequest") {
        userAdminService.updateUserProperties(request.getOrganizationId(), request.username, request.properties, request.deletedPropertyKeys)
      }
    }

  filter(permissionFilter.require("user:suspend:[username]"))
    .post("/admin/users/:username/activate") { request: ActivateRequest =>
      Profiler(s"[AdminUser] ${this.getClass.getSimpleName}::ActivateRequest") {
        userAdminService.activate(request.getOrganizationId(), request.username)
      }
    }

  filter(permissionFilter.require("user:suspend:[username]"))
    .post("/admin/users/:username/deactivate") { request: DeactivateRequest =>
      Profiler(s"[AdminUser] ${this.getClass.getSimpleName}::DeactivateRequest") {
        userAdminService.deactivate(request.getOrganizationId(), request.username)
      }
    }

  filter(permissionFilter.require("user:view:*"))
    .post("/admin/users/search") { request: SearchUserRequest =>
      Profiler(s"[AdminUser] ${this.getClass.getSimpleName}::SearchUserRequest") {
        userAdminService.searchUsers(
          request.getOrganizationId(),
          request.isActive,
          request.from.getOrElse(0),
          request.size.getOrElse(20)
        )
      }
    }

  filter(permissionFilter.require("user:view:*"))
    .post("/admin/users/search/v2") { request: SearchUserRequest =>
      Profiler(s"[AdminUser] ${this.getClass.getSimpleName}::SearchUserRequest") {
        userAdminService.searchUsersV2(
          request.getOrganizationId(),
          request.keyword,
          request.from.getOrElse(0),
          request.size.getOrElse(20),
          request.userType
        )
      }
    }

  filter(permissionFilter.require("user:delete:[username]"))
    .delete("/admin/users/:username/delete") { request: DeleteUserRequest =>
      Profiler(s"[AdminUser] ${this.getClass.getSimpleName}::DeleteUserRequest") {
        userAdminService.delete(request.getOrganizationId(), request)
      }
    }
}
