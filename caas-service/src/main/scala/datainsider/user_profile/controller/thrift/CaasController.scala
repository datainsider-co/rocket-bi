package datainsider.user_profile.controller.thrift

import com.google.inject.Inject
import com.twitter.finatra.thrift.Controller
import com.twitter.inject.Logging
import com.twitter.scrooge.{Request, Response}
import com.twitter.util.{Future, Return, Throw}
import datainsider.apikey.service.ApiKeyService
import datainsider.client.domain.ThriftImplicit.{RichListUserLike, RichUser, RichUserProfileLike, ScroogeResponseLike, TLoginResponseLike, TOrganizationLike, TRoleInfoLike, TUserInfoLike}
import datainsider.client.domain.user.{LoginResponse, UserProfile}
import datainsider.client.exception.NotFoundError
import datainsider.profiler.Profiler
import datainsider.user_caas.domain.Page
import datainsider.user_caas.domain.thrift._
import datainsider.user_caas.service.{CaasService, OrgAuthorizationService, UserService}
import datainsider.user_profile.domain.thrift._
import datainsider.user_profile.service.TOrganizationService._
import datainsider.user_profile.service.TUserProfileService._
import datainsider.user_profile.service.{AuthService, OrganizationService, TUserProfileService, UserProfileService}
import datainsider.user_profile.util.JsonParser

import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author anhlt
  */
class CaasController @Inject() (
    authService: AuthService,
    caasService: CaasService,
    userService: UserService,
    profileService: UserProfileService,
    organizationService: OrganizationService,
    orgAuthorizationService: OrgAuthorizationService,
    apiKeyService: ApiKeyService
) extends Controller(TUserProfileService)
    with Logging {

  handle(Ping).withFn { _: Request[Ping.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::Ping") {
      Future.value(Response(value = "Pong"))
    }
  }

  handle(IsOrganizationExists).withFn { request: Request[IsOrganizationExists.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::IsOrganizationExists") {
      organizationService
        .isExists(request.args.organizationId)
        .map(Response(_))
    }
  }

  handle(GetOrganization).withFn { request: Request[GetOrganization.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetOrganization") {
      organizationService
        .getOrganization(request.args.organizationId)
        .map({
          case Some(organization) => organization
          case _                  => throw NotFoundError("this organization not found")
        })
        .map(_.asThrift())
        .map(_.toScroogeResponse())
    }
  }

  handle(GetOrganizations).withFn { request: Request[GetOrganizations.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetOrganizations") {
      organizationService
        .getOrganizations(request.args.organizationIds)
        .map(_.map(e => e._1 -> e._2.asThrift).toMap)
        .map(Response(_))
    }
  }

  handle(IsOrganizationMember).withFn { request: Request[IsOrganizationMember.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::IsOrganizationMember") {
      organizationService
        .isOrganizationMember(request.args.organizationId, request.args.username)
        .map(Response(_))
    }
  }

  handle(GetAllOrganizations).withFn { request: Request[GetAllOrganizations.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetAllOrganizations") {
      organizationService
        .getAllOrganizations(request.args.from, request.args.size)
        .map { result =>
          TListOrganizationResponse(result.total, Option(result.data.map(_.asThrift())))
        }
        .map(_.toScroogeResponse())
    }
  }

  handle(CheckSession).withFn { request: Request[CheckSession.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::CheckSession") {
      authService
        .checkSession(request.args.sessionId)
        .rescue {
          case e: Throwable =>
            error("CheckSession", e)
            Future.value(LoginResponse(null, null))
        }
        .map(_.asThrift)
        .map(_.toScroogeResponse())
    }
  }

  handle(GetFullUserProfileBySessionId).withFn { request: Request[GetFullUserProfileBySessionId.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetFullUserProfileBySessionId") {
      for {
        loginResult <- authService.checkSession(request.args.sessionId)
      } yield {
        TFullUserProfileResponse(
          true,
          Option(loginResult.userInfo.asThrift),
          loginResult.userProfile.map(_.asThrift)
        ).toScroogeResponse()
      }
    }
  }

  handle(GetFullUserProfile).withFn { request: Request[GetFullUserProfile.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetFullUserProfile") {
      for {
        user <- userService.getUserInfo(request.args.organizationId, request.args.username)
        userProfile <- profileService.getUserProfile(request.args.organizationId, request.args.username)
      } yield {
        TFullUserProfileResponse(
          true,
          Some(user.toUserInfo.asThrift),
          userProfile.map(_.asThrift)
        ).toScroogeResponse()
      }
    }
  }

  handle(GetUserProfile).withFn { request: Request[GetUserProfile.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetUserProfile") {
      profileService
        .getUserProfile(request.args.organizationId, request.args.username)
        .map {
          case Some(x) => TUserProfileResponse(true, Some(x.asThrift))
          case _       => TUserProfileResponse(false)
        }
        .map(_.toScroogeResponse())
    }
  }

  handle(MultiGetUserProfiles).withFn { request: Request[MultiGetUserProfiles.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::MultiGetUserProfiles") {
      profileService
        .getUserProfiles(request.args.organizationId, request.args.usernames.toSeq)
        .map(r => {
          TMultiUserProfileResponse(
            total = r.size,
            userProfiles = Some(r.map(e => e._1 -> e._2.asThrift))
          )
        })
        .map(_.toScroogeResponse())
    }
  }

  handle(GetProfileByEmail).withFn { request: Request[GetProfileByEmail.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetProfileByEmail") {
      profileService
        .getUserProfileByEmail(request.args.organizationId, request.args.email)
        .map(profile => TUserProfileResponse(true, Some(profile.asThrift)))
        .transform {
          case Return(r) => Future.value(r)
          case Throw(e) =>
            error("GetProfileByEmail", e)
            Future.value(TUserProfileResponse(false, None))
        }
        .map(_.toScroogeResponse())
    }
  }

  handle(GetActiveUserProfiles).withFn { request: Request[GetActiveUserProfiles.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetActiveUserProfiles") {
      profileService
        .listActiveUserDetails(request.args.organizationId, request.args.from, request.args.size)
        .rescue({
          case e =>
            error("GetActiveUserProfiles", e)
            Future.value(Page.empty[UserProfile])
        })
        .map(profilePage => TListUserProfileResponse(profilePage.total, Option(profilePage.data.map(_.asThrift))))
        .map(_.toScroogeResponse())
    }
  }

  handle(GetActiveUsername).withFn { request: Request[GetActiveUsername.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetActiveUsername") {
      val args = request.args
      userService.listActiveUserIds(request.args.organizationId, args.from, args.size).map { result =>
        TListUsernameResult(
          0,
          users = Option(result).map(_.data),
          total = Some(result.total)
        ).toScroogeResponse()
      }
    }
  }

  handle(GetRoles).withFn { request: Request[GetRoles.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetRoles") {
      val args = request.args
      caasService
        .getRoles(args.sessionId)
        .map(result => {
          TListStringResult(0, data = Some(result)).toScroogeResponse()
        })
    }
  }

  handle(HasRoles).withFn { request: Request[HasRoles.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::HasRoles") {
      val args = request.args
      caasService
        .hasRoles(args.sessionId, args.roles)
        .map(result => {
          TMapStringBoolResult(0, data = Some(result)).toScroogeResponse()
        })
    }
  }

  handle(HasAllRoles).withFn { request: Request[HasAllRoles.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::HasAllRoles") {
      val args = request.args
      caasService
        .hasAllRoles(args.sessionId, args.roleNames)
        .map(result => {
          TBoolResult(0, data = Some(result)).toScroogeResponse()
        })
    }
  }

  handle(IsPermitted).withFn { request: Request[IsPermitted.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::IsPermitted") {
      val args = request.args
      caasService
        .isPermitted(args.sessionId, args.permissions)
        .map(result => {
          TMapStringBoolResult(0, data = Some(result)).toScroogeResponse()
        })
    }
  }

  handle(IsPermittedAll).withFn { request: Request[IsPermittedAll.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::IsPermittedAll") {
      val args = request.args
      caasService
        .isPermittedAll(args.sessionId, args.permissions)
        .map(result => {
          TBoolResult(0, data = Some(result)).toScroogeResponse()
        })
    }
  }

  //Org

  handle(GetUserByRoles).withFn { request: Request[GetUserByRoles.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetUserByRoles") {
      Future {
        val args = request.args
        val result = userService.getListUserByRoles(
          args.organizationId,
          args.notInRoleIds,
          args.inRoleIds,
          args.from,
          args.size
        )
        TListUserResult(
          0,
          users = Option(result).map(_.data.toThrift),
          total = Some(result.total)
        ).toScroogeResponse()
      }
    }
  }

  handle(GetAllRoleInfos).withFn { request: Request[GetAllRoleInfos.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetAllRoleInfos") {
      val args = request.args
      caasService
        .orgAuthorization()
        .getActiveRoles(args.organizationId, args.username)
        .map { result =>
          TListRoleInfoResult(
            0,
            username = args.username,
            roles = Option(result.map(_.asThrift())).filterNot(_.isEmpty)
          ).toScroogeResponse()
        }
    }
  }

  handle(AddRoles).withFn { request: Request[AddRoles.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::AddRoles") {
      val args = request.args
      caasService
        .orgAuthorization()
        .addRoles(args.organizationId, args.username, args.roleIds.map(roleId => roleId -> Long.MaxValue).toMap)
        .map(_ => TBoolResult(0, data = Some(true)))
        .rescue({
          case e: Throwable =>
            error("AddRoles", e)
            Future.value(TBoolResult(-1, data = Some(false)))
        })
        .map(_.toScroogeResponse())
    }
  }

  handle(RemoveRoles).withFn { request: Request[RemoveRoles.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::RemoveRoles") {
      val args = request.args
      caasService
        .orgAuthorization()
        .removeRoles(args.organizationId, args.username, args.roleIds.toSet)
        .map(_ => TBoolResult(0, data = Some(true)))
        .rescue {
          case e: Throwable =>
            error("RemoveRoles", e)
            Future.value(TBoolResult(-1, data = Some(false)))
        }
        .map(_.toScroogeResponse())
    }
  }

  handle(HasOrgRole).withFn { request: Request[HasOrgRole.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::HasOrgRole") {
      val args = request.args
      caasService
        .orgAuthorization()
        .hasRole(args.organizationId, args.username, args.roleName)
        .map(result => {
          TBoolResult(0, data = Some(result)).toScroogeResponse()
        })
    }
  }

  handle(HasOrgRoles).withFn { request: Request[HasOrgRoles.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::HasOrgRoles") {
      val args = request.args
      caasService
        .orgAuthorization()
        .hasRoles(args.organizationId, args.username, args.roleNames)
        .map(result => {
          TMapStringBoolResult(0, data = Some(result)).toScroogeResponse()
        })
    }
  }

  handle(HasAllOrgRoles).withFn { request: Request[HasAllOrgRoles.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::HasAllOrgRoles") {
      val args = request.args
      caasService
        .orgAuthorization()
        .hasAllRoles(args.organizationId, args.username, args.roleNames)
        .map(result => {
          TBoolResult(0, data = Some(result)).toScroogeResponse()
        })
    }
  }

  handle(AddOrgPermissions).withFn { request: Request[AddOrgPermissions.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::AddOrgPermissions") {
      for {
        args <- Future.value(request.args)
        result <- caasService.orgAuthorization().addPermissions(args.organizationId, args.username, args.permissions)
      } yield {
        TBoolResult(0, data = Some(result)).toScroogeResponse()
      }
    }
  }

  handle(RemoveOrgPermissions).withFn { request: Request[RemoveOrgPermissions.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::RemoveOrgPermissions") {
      for {
        args <- Future.value(request.args)
        result <- caasService.orgAuthorization().removePermissions(args.organizationId, args.username, args.permissions)
      } yield {
        TBoolResult(0, data = Some(true)).toScroogeResponse()
      }
    }

  }

  handle(GetAllPermissions).withFn { request: Request[GetAllPermissions.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetAllPermissions") {
      val args = request.args
      caasService
        .orgAuthorization()
        .getAllPermissions(args.organizationId, args.username)
        .map { result => TListStringResult(0, data = Option(result)) }
        .map(_.toScroogeResponse)
    }
  }

  handle(IsOrgPermitted).withFn { request: Request[IsOrgPermitted.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::IsOrgPermitted") {
      val args = request.args
      caasService
        .orgAuthorization()
        .isPermitted(args.organizationId, args.username, args.permissions: _*)
        .map { result =>
          TMapStringBoolResult(0, data = Option(result))
        }
        .map(_.toScroogeResponse)
    }
  }

  handle(IsOrgPermittedAll).withFn { request: Request[IsOrgPermittedAll.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::IsOrgPermittedAll") {
      val args = request.args
      caasService
        .orgAuthorization()
        .isPermittedAll(args.organizationId, args.username, args.permissions: _*)
        .map(result => TBoolResult(0, data = Some(result)))
        .map(_.toScroogeResponse)
    }
  }

  handle(ChangePermissions).withFn { request: Request[ChangePermissions.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::ChangePermissions") {
      val args = request.args
      orgAuthorizationService
        .changePermissions(args.organizationId, args.username, args.includePermissions, args.excludePermissions)
        .map(result => TBoolResult(0, data = Some(result)))
        .map(_.toScroogeResponse())
    }
  }

  handle(GetWithDomain).withFn { request: Request[GetWithDomain.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetWithDomain") {
      organizationService
        .getByDomain(request.args.domain)
        .map(_.asThrift())
        .map(_.toScroogeResponse())
    }
  }

  handle(LoginByEmail).withFn { request: Request[LoginByEmail.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::LoginByEmail") {
      {
        getUsernameByEmail(request.args.organizationId, request.args.email).flatMap {
          case Some(username) =>
            authService
              .login(request.args.organizationId, username, request.args.password)
              .map(loginResult => TStringResult(0, data = Some(loginResult.session.value)))
              .rescue {
                case ex: Throwable => {
                  error(s"loginToOrg::error ${ex.getMessage}")
                  Future.value(TStringResult(-1, msg = Some(ex.getMessage)))
                }
              }
              .map(_.toScroogeResponse())
          case _ =>
            Future.value(TStringResult(-1, msg = Some("your credentials is not found: email")).toScroogeResponse())
        }

      }
    }
  }

  private def getUsernameByEmail(organizationId: Long, email: String): Future[Option[String]] =
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::getUsernameByEmail") {
      profileService.getUserProfileByEmail(organizationId, email).map(user => Some(user.username)).rescue {
        case ex: Exception =>
          error(s"getUsernameByEmail:: ${ex.getMessage}")
          Future.None
      }
    }

  handle(GetUsername).withFn { request: Request[GetUsername.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetUsername") {
      caasService
        .loginBySessionId(request.args.sessionId)
        .map(result => TStringResult(0, data = Some(result.user.username)))
        .rescue {
          case ex: Throwable => {
            error(s"GetUsername::error ${ex.getMessage}")
            Future.value(TStringResult(-1, msg = Some(ex.getMessage)))
          }
        }
        .map(_.toScroogeResponse())
    }
  }

  handle(GetApiKey).withFn { request: Request[GetApiKey.Args] =>
    Profiler(s"[Thrift] ${this.getClass.getSimpleName}::GetApiKey") {
      apiKeyService
        .get(request.args.apiKey)
        .map(result => TStringResult(0, data = Some(JsonParser.toJson(result))))
        .rescue {
          case ex: Throwable => {
            error(s"GetApiKey::error ${ex.getMessage}")
            Future.value(TStringResult(-1, msg = Some(ex.getMessage)))
          }
        }
        .map(_.toScroogeResponse())
    }
  }
}
