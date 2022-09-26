package datainsider.user_profile.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finagle.thrift.Headers.Response
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.profiler.Profiler
import datainsider.user_profile.controller.http.filter.user.AdminUserFilter
import datainsider.user_profile.controller.http.request.{
  ChangeUserPasswordRequest,
  EditProfileRequest,
  GetUserProfileRequest,
  MultiGetUserProfileRequest,
  SuggestionUserRequest
}
import datainsider.user_profile.service.UserProfileService
import datainsider.user_profile.util.Utils

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author anhlt
  */
class UserProfileController @Inject() (profileService: UserProfileService) extends Controller with Logging {

  get(s"/user/profile/me") { request: Request =>
    Profiler(s"[Http] UserProfileController::GetMyProfile") {
      profileService
        .getUserProfile(request.getOrganizationId(), request.currentUsername)
        .map(Utils.throwIfNotExist(_, Some("this profile is not found.")))
    }
  }

  put(s"/user/profile/me") { request: EditProfileRequest =>
    Profiler(s"[Http] UserProfileController::EditMyProfileRequest") {
      profileService.updateProfile(request.getOrganizationId(), request.currentUsername, request)
    }
  }

  get(s"/user/profile/:username") { request: GetUserProfileRequest =>
    Profiler(s"[Http] UserProfileController::GetUserProfileRequest") {
      profileService
        .getUserProfile(request.getOrganizationId(), request.username)
        .map(Utils.throwIfNotExist(_, Some("this profile is not found.")))
    }
  }

  post(s"/user/profile/multi_get") { request: MultiGetUserProfileRequest =>
    Profiler(s"[Http] UserProfileController::MultiGetUserProfileRequest") {
      profileService.getUserProfiles(request.getOrganizationId(), request.usernames)
    }
  }

  post(s"/user/profile/suggest") { request: SuggestionUserRequest =>
    Profiler(s"[Http] UserProfileController::SuggestionUserRequest") {
      profileService.searchUsers(request.getOrganizationId(), request.keyword, request.userType, request.from, request.size)
    }
  }

  put(s"/user/profile/change_password") { request: ChangeUserPasswordRequest =>
    Profiler(s"[Http] UserProfileController::ChangeUserPasswordRequest") {
      profileService
        .changePassword(request.getOrganizationId(), request.currentUsername, request.oldPass, request.newPass)
        .map(response => Map("success" -> response))
    }
  }
}
