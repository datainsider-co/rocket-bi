package co.datainsider.caas.user_profile.controller.http.filter.parser

import co.datainsider.caas.apikey.domain.response.ApiKeyResponse
import co.datainsider.caas.user_profile.client.{CaasClientService, OrgClientService}
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserAuthField
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.domain.user.{LoginResponse, SessionInfo, UserInfo, UserProfile}
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.inject.Logging
import com.twitter.util.{Future, Return, Throw}
import co.datainsider.common.client.domain.Implicits.RichOptionString
import co.datainsider.common.client.exception.{BadRequestError, UnAuthenticatedError}
import co.datainsider.common.client.util.Implicits.ImplicitRequestLike
import co.datainsider.common.client.util.JsonParser

import javax.inject.Inject

/**
  * @author anhlt
  */

object UserContext {
  val UserAuthField = Request.Schema.newField[Option[LoginResponse]]

  implicit class UserContextSyntax(val request: Request) extends AnyVal {

    @throws[UnAuthenticatedError]("if the session is not authenticated")
    def ensureLoggedIn: Unit = {
      if (request.ctx(UserAuthField).isEmpty) {
        throw UnAuthenticatedError("the session is expired or invalid.")
      }
    }

    def optLoginResponse: Option[LoginResponse] = request.ctx(UserAuthField)

    @throws[UnAuthenticatedError]("if the session is not authenticated")
    def loginResponse: LoginResponse = {
      request.ctx(UserAuthField) match {
        case Some(x) => x
        case _       => throw UnAuthenticatedError("the session is expired or invalid.")
      }
    }

    def isAuthenticated = optLoginResponse.isDefined

    @throws[UnAuthenticatedError]("if the session is not authenticated")
    def currentSession: SessionInfo = loginResponse.session

    @throws[UnAuthenticatedError]("if the session is not authenticated")
    def currentUsername: String = loginResponse.userInfo.username

    @throws[UnAuthenticatedError]("if the session is not authenticated")
    def currentUser: UserInfo = loginResponse.userInfo

    @throws[UnAuthenticatedError]("if the session is not authenticated")
    def currentProfile: Option[UserProfile] = loginResponse.userProfile

    def currentOrganization: Option[Organization] = {
      optLoginResponse.flatMap(_.userInfo.organization)
    }

    def currentOrganizationId: Option[Long] = {
      optLoginResponse.flatMap(_.userInfo.organization).map(_.organizationId)
    }

    @throws[UnAuthenticatedError]("if the session is not authenticated")
    def getOrganizationId(): Long = {
      val orgId: Option[Long] = currentOrganizationId
      if (orgId.isEmpty) {
        throw UnAuthenticatedError("the session is expired or invalid.")
      } else {
        orgId.get
      }
    }

    def getRequestDomain(): String = {
      request.headerMap.get("Host") match {
        case Some(host) => host.split('.').head
        case None       => ""
      }
    }
  }

}

class LoggedInUserParser @Inject() (
    resolver: UserSessionResolver
) extends SimpleFilter[Request, Response] {

  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    resolver
      .resolveUser(request)
      .map(authInfo => {
        request.ctx.update(UserAuthField, authInfo)
      })
      .flatMap(_ => service(request))
  }
}

trait UserSessionResolver {
  def resolveUser(request: Request): Future[Option[LoginResponse]]
}

case class MockUserSessionResolver() extends UserSessionResolver {
  override def resolveUser(request: Request): Future[Option[LoginResponse]] =
    Future {
      Some(JsonParser.fromJson[LoginResponse]("""{
        |  "session": {
        |    "key": "ssid",
        |    "value": "05c91ec8-719e-41c0-9b52-1846a8eeb921",
        |    "domain": ".datainsider.co",
        |    "timeout_in_ms": 31104000000,
        |    "path": "/",
        |    "max_age": 1629303213482
        |  },
        |  "user_info": {
        |    "username": "test@gmail.com",
        |    "organization": {
        |      "organization_id": 1,
        |      "owner": "test@gmail.com",
        |      "name": "Data Insider",
        |      "created_time": 0,
        |      "licence_key": "1234567890"
        |    },
        |    "roles": [],
        |    "is_active": true,
        |    "created_time": 1598195240844
        |  },
        |  "user_profile": {
        |    "username": "test@gmail.com",
        |    "already_confirmed": true,
        |    "full_name": "Andy",
        |    "email": "test@gmail.com",
        |    "updated_time": 1598195240246,
        |    "created_time": 1598195240246
        |  },
        |  "default_oauth_credential": false
        |}""".stripMargin))
    }
}

case class DefaultUserSessionResolver @Inject() (
    client: CaasClientService,
    orgClientService: OrgClientService
) extends UserSessionResolver
    with Logging {

  override def resolveUser(request: Request): Future[Option[LoginResponse]] = {
    getSessionId(request) match {
      case Some(sessionId) =>
        client
          .checkSession(sessionId)
          .transform({
            case Return(r) => Future.value(Option(r))
            case Throw(e) =>
              error(s"getUserFromSession($sessionId)", e)
              Future.None
          })
      case None =>
        resolveFromApiKey(request)
    }
  }

  private def getSessionId(request: Request): Option[String] = {

    val authCookie = request.cookies.get("ssid").map(_.value).notNullOrEmpty
    val authHeader = request.headerMap.get("Authorization").notNullOrEmpty

    if (authCookie.isDefined) authCookie else authHeader
  }

  private def getApiKey(request: Request): Option[String] = {
    try {
      val apiKey: String = request.getQueryOrBodyParam("api_key")
      Some(apiKey)
    } catch {
      case e: BadRequestError => None
    }
  }

  private def resolveFromApiKey(request: Request): Future[Option[LoginResponse]] = {
    getApiKey(request) match {
      case Some(apiKey) =>
        for {
          apiKeyResp <- client.getApiKey(apiKey)
          org <- orgClientService.getOrganization(apiKeyResp.apiKeyInfo.organizationId)
        } yield {
          toLoginResponse(apiKeyResp, org.licenceKey)
        }
      case None => Future.None
    }
  }

  private def toLoginResponse(apiKeyResp: ApiKeyResponse, licenseKey: String): Option[LoginResponse] = {
    val username: String = apiKeyResp.apiKeyInfo.apiKey
    val orgId: Long = apiKeyResp.apiKeyInfo.organizationId
    val permissionStr = JsonParser.toJson(apiKeyResp.permissions)

    Some(
      JsonParser.fromJson[LoginResponse](
        s"""
           |{
           |  "session": {
           |    "key": "ssid",
           |    "value": "$username",
           |    "domain": ".datainsider.co",
           |    "timeout_in_ms": 31104000000,
           |    "path": "/",
           |    "max_age": 1629303213482
           |  },
           |  "user_info": {
           |    "username": "$username",
           |    "organization": {
           |      "organization_id": $orgId,
           |      "owner": "root",
           |      "name": "System",
           |      "created_time": 0,
           |      "licence_key": "$licenseKey"
           |    },
           |    "permissions": $permissionStr,
           |    "roles": [],
           |    "is_active": true,
           |    "created_time": 0
           |  },
           |  "user_profile": {
           |    "username": "$username",
           |    "already_confirmed": true,
           |    "full_name": "${apiKeyResp.apiKeyInfo.displayName}",
           |    "email": "system@datainsider.co",
           |    "updated_time": 0,
           |    "created_time": ${apiKeyResp.apiKeyInfo.createdAt}
           |  },
           |  "default_oauth_credential": false
           |}
           |""".stripMargin
      )
    )
  }
}

object MockUserContext {
  def getLoggedInRequest(orgId: Long, username: String): Request = {
    val loggedInRequest = Request()
    val authInfo = Some(JsonParser.fromJson[LoginResponse](s"""
        |{
        |  "session": {
        |    "key": "ssid",
        |    "value": "05c91ec8-719e-41c0-9b52-1846a8eeb921",
        |    "domain": ".datainsider.co",
        |    "timeout_in_ms": 31104000000,
        |    "path": "/",
        |    "max_age": 1629303213482
        |  },
        |  "user_info": {
        |    "username": "$username",
        |    "organization": {
        |      "organization_id": $orgId,
        |      "owner": "mock_user@gmail.com",
        |      "name": "Data Insider",
        |      "created_time": 0
        |    },
        |   "permissions": ["*:*:*:*"],
        |    "roles": [],
        |    "is_active": true,
        |    "created_time": 1598195240844
        |  },
        |  "user_profile": {
        |    "username": "$username",
        |    "already_confirmed": true,
        |    "full_name": "Eren Yeager",
        |    "email": "test@gmail.com",
        |    "updated_time": 1598195240246,
        |    "created_time": 1598195240246
        |  },
        |  "default_oauth_credential": false
        |}
        |""".stripMargin))
    loggedInRequest.ctx.update(UserAuthField, authInfo)
    loggedInRequest
  }

}
