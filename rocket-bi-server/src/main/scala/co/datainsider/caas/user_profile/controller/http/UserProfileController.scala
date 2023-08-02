package co.datainsider.caas.user_profile.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.inject.Logging
import co.datainsider.caas.user_profile.controller.http.request.{
  ChangeUserPasswordRequest,
  EditProfileRequest,
  GetUserProfileRequest,
  MultiGetUserProfileRequest,
  SuggestionUserRequest
}
import co.datainsider.caas.user_profile.service.UserProfileService
import co.datainsider.caas.user_profile.util.Utils
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax

import javax.inject.Inject

/**
  * @author anhlt
  */
class UserProfileController @Inject() (profileService: UserProfileService) extends Controller with Logging {

  get(s"/user/profile/me") { request: Request =>
    Profiler(s"/user/profile/me GET") {
      profileService
        .getUserProfile(request.getOrganizationId(), request.currentUsername)
        .map(Utils.throwIfNotExist(_, Some("this profile is not found.")))
    }
  }

  put(s"/user/profile/me") { request: EditProfileRequest =>
    Profiler(s"/user/profile/me PUT")
    UserActivityTracker(
      request = request.request,
      actionName = request.getClass.getSimpleName,
      actionType = ActionType.Update,
      resourceType = ResourceType.User,
      resourceId = request.currentUsername,
      description = s"update profile of user: ${request.currentUsername}"
    ) {
      profileService.updateProfile(request.getOrganizationId(), request.currentUsername, request)
    }
  }

  get(s"/user/profile/:username") { request: GetUserProfileRequest =>
    Profiler(s"/user/profile/:username") {
      profileService
        .getUserProfile(request.getOrganizationId(), request.username)
        .map(Utils.throwIfNotExist(_, Some("this profile is not found.")))
    }
  }

  post(s"/user/profile/multi_get") { request: MultiGetUserProfileRequest =>
    Profiler(s"/user/profile/multi_get") {
      profileService.getUserProfiles(request.getOrganizationId(), request.usernames)
    }
  }

  post(s"/user/profile/suggest") { request: SuggestionUserRequest =>
    Profiler(s"/user/profile/suggest") {
      profileService.searchUsers(
        request.getOrganizationId(),
        request.keyword,
        request.userType,
        request.from,
        request.size
      )
    }
  }

  put(s"/user/profile/change_password") { request: ChangeUserPasswordRequest =>
    Profiler(s"/user/profile/change_password") {
      profileService
        .changePassword(request.getOrganizationId(), request.currentUsername, request.oldPass, request.newPass)
        .map(response => Map("success" -> response))
    }
  }
}
