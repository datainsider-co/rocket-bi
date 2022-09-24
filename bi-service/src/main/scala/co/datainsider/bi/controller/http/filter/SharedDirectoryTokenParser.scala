package co.datainsider.bi.controller.http.filter

import co.datainsider.bi.controller.http.filter.AnonymousLoginResponse.anonymousLoginResponse
import co.datainsider.bi.controller.http.filter.dashboard.DashboardFilter
import co.datainsider.bi.domain.Ids.DashboardId
import co.datainsider.bi.service.DashboardService
import co.datainsider.share.service.DirectoryPermissionService
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import datainsider.client.domain.org.Organization
import datainsider.client.domain.user.{LoginResponse, SessionInfo, UserInfo, UserProfile}
import datainsider.client.filter.UserContext.UserAuthField
import datainsider.client.service.OrgClientService

import javax.inject.{Inject, Named}

/** *
  * Tạo user từ token
  * Nếu đã có user rồi, thì không cần parser
  * Nếu không token thì bỏ qua
  */
class SharedDirectoryTokenParser @Inject() (
    orgClientService: OrgClientService,
    @Named("token_header_key") tokenKey: String,
    directoryPermissionService: DirectoryPermissionService,
    dashboardService: DashboardService
) extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    val domain: String = request.headerMap.get("Host").get
    val dashboardId: DashboardId = DashboardFilter.getDashboardId(request)
    val tokenId: Option[String] = request.headerMap.get(tokenKey)
    val action: String = "view"

    request.ctx(UserAuthField) match {
      case Some(_) => service(request)
      case _ if tokenId.isDefined =>
        val result = for {
          directoryId <- dashboardService.getDirectoryId(dashboardId)
          organization <- orgClientService.getWithDomain(domain)
          isTokenValid <-
            directoryPermissionService.isPermitted(tokenId.get, organization.organizationId, directoryId, action)
        } yield {
          if (isTokenValid) {
            request.ctx.update(UserAuthField, Some(anonymousLoginResponse(organization, tokenId.get)))
            service(request)
          } else service(request)
        }
        result.flatten
      case _ => service(request)
    }
  }
}

object AnonymousLoginResponse {
  def anonymousSession(tokenId: String): SessionInfo =
    SessionInfo(
      key = "ssid",
      value = s"token_$tokenId",
      domain = ".datainsider.co",
      maxAgeInMs = 1629303213482L,
      createdAt = None,
      path = "/"
    )
  def anonymousUserInfo(organization: Organization): UserInfo =
    UserInfo(
      username = "",
      roles = Seq.empty,
      isActive = false,
      createdTime = 1598195240844L,
      organization = Some(organization),
      permissions = Set.empty
    )
  def anonymousUserProfile: UserProfile =
    UserProfile(
      username = "andy@gmail.com",
      fullName = Some("Andy"),
      email = Some("andy@gmail.com")
    )
  def anonymousLoginResponse(organization: Organization, tokenId: String): LoginResponse = {
    LoginResponse(anonymousSession(tokenId), anonymousUserInfo(organization), Some(anonymousUserProfile))
  }
}
