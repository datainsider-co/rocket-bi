package co.datainsider.caas.user_profile.controller.http.filter

import com.fasterxml.jackson.annotation.JsonIgnore
import com.twitter.finagle.http.{Request, Response}
import com.twitter.finagle.{Service, SimpleFilter}
import com.twitter.util.Future
import co.datainsider.caas.user_profile.domain.org.Organization
import co.datainsider.caas.user_profile.domain.user.{SessionInfo, UserInfo, UserProfile}
import co.datainsider.common.client.exception.UnAuthenticatedError
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext._

/**
  * @author anhlt
  */
trait LoggedInRequest {
  val request: Request

  @JsonIgnore
  def isAuthenticated: Boolean = request.isAuthenticated

  @throws[UnAuthenticatedError]("if the session is not authenticated")
  def currentSession: SessionInfo = request.currentSession

  @throws[UnAuthenticatedError]("if the session is not authenticated")
  def currentUsername: String = request.currentUser.username

  @throws[UnAuthenticatedError]("if the session is not authenticated")
  def currentUser: UserInfo = request.currentUser

  def currentProfile: Option[UserProfile] = request.currentProfile

  def currentOrganization: Option[Organization] = request.currentOrganization

  def currentOrganizationId: Option[Long] = request.currentOrganizationId

  @throws[UnAuthenticatedError]("if the session is not authenticated")
  @JsonIgnore
  def getOrganizationId(): Long = request.getOrganizationId()

  @JsonIgnore
  def getRequestDomain(): String = request.getRequestDomain()
}

class MustLoggedInFilter() extends SimpleFilter[Request, Response] {
  override def apply(request: Request, service: Service[Request, Response]): Future[Response] = {
    request.ensureLoggedIn
    service(request)
  }
}
