package datainsider.user_caas.service

import com.twitter.inject.Logging
import com.twitter.util.Future
import datainsider.client.domain.user.{LoginResult, SessionInfo, User}
import datainsider.client.exception.AlreadyExistError
import datainsider.login_provider.domain.OAuthInfo
import datainsider.login_provider.service.OrgOAuthorizationProvider
import datainsider.user_caas.domain.SessionConfig
import datainsider.user_caas.repository.RoleRepository
import org.apache.shiro.session.Session

import javax.inject.Inject

/**
  * @author sonpn
  * @since 07/2020 andy: try to refactoring the code & add new features
  * @since 08/2021 nkthien: completely replace UserAuthentication with OrgAuthentication
  */
trait CaasService {

  def renewSession(organizationId: Long, oldSessionId: String, ssTimeout: Option[Long]): Future[LoginResult]

  def loginWithOAuth(
      organizationId: Long,
      oauthType: String,
      id: String,
      token: String,
      ssTimeout: Option[Long],
      password: Option[String]
  ): Future[LoginResult]

  def loginToOrg(
      organizationId: Long,
      username: String,
      password: String,
      ssTimeout: Option[Long] = None
  ): Future[LoginResult]

  def loginOAuth(organizationId: Long, username: String, ssTimeout: Option[Long]): Future[LoginResult]

  def logout(sessionId: String): Future[Unit]

  def loginBySessionId(sessionId: String): Future[LoginResult]

  def deleteUser(organizationId: Long, username: String): Future[Unit]

  def resetUserPassword(organizationId: Long, username: String, newPassword: String): Future[Unit]

  def updateUserPassword(organizationId: Long, username: String, oldPassword: String, newPassword: String): Future[Unit]

  def getRoles(sessionId: String): Future[Seq[String]]

  def hasRole(sessionId: String, role: String): Future[Boolean]

  def hasRoles(sessionId: String, roles: Seq[String]): Future[Map[String, Boolean]]

  def hasAllRoles(sessionId: String, roles: Seq[String]): Future[Boolean]

  def isPermitted(sessionId: String, permission: String): Future[Boolean]

  def isPermitted(sessionId: String, permissions: Seq[String]): Future[Map[String, Boolean]]

  def isPermittedAll(sessionId: String, permissions: Seq[String]): Future[Boolean]

  def orgAuthorization(): OrgAuthorizationService
}

case class CaasServiceImpl @Inject() (
    sessionConfig: SessionConfig,
    caas: Caas,
    orgAuthorizationService: OrgAuthorizationService,
    userService: UserService,
    roleRepository: RoleRepository,
    orgOAuthorizationProvider: OrgOAuthorizationProvider
) extends CaasService
    with Logging {

  override def orgAuthorization(): OrgAuthorizationService = orgAuthorizationService

  override def renewSession(
      organizationId: Long,
      oldSessionId: String,
      expiredTimeInMs: Option[Long]
  ): Future[LoginResult] = {
    val (username, session) = caas.renewSession(
      organizationId,
      oldSessionId,
      expiredTimeInMs.getOrElse(sessionConfig.expiredTimeInMs)
    )
    buildLoginResult(username, session)
  }

  override def loginWithOAuth(
      organizationId: Long,
      oauthType: String,
      id: String,
      token: String,
      expiredTimeInMs: Option[Long],
      password: Option[String]
  ): Future[LoginResult] = {

    def createUserIfNotExists(oauthInfo: OAuthInfo): Future[OAuthInfo] = {
      userService
        .createUser(
          organizationId,
          oauthInfo.username,
          password.getOrElse(orgOAuthorizationProvider.generatePassword())
        )
        .rescue {
          case err: AlreadyExistError =>
            error("Can't create user", err)
            Future.Unit
        }
        .map(_ => oauthInfo)
    }

    orgOAuthorizationProvider
      .getOAuthInfo(organizationId, oauthType, id, token)
      .flatMap(createUserIfNotExists)
      .flatMap { oauthInfo =>
        val session = caas.loginOAuthToOrg(
          organizationId,
          oauthInfo.username,
          expiredTimeInMs.getOrElse(sessionConfig.expiredTimeInMs)
        )
        buildLoginResult(oauthInfo.username, session)
      }
  }

  override def loginToOrg(
      organizationId: Long,
      username: String,
      password: String,
      ssTimeout: Option[Long]
  ): Future[LoginResult] = {
    if (password == null || password.isEmpty)
      throw new Exception("password is empty")
    val session = caas.loginToOrg(
      organizationId,
      username,
      password,
      ssTimeout.getOrElse(sessionConfig.expiredTimeInMs)
    )
    buildLoginResult(username, session)
  }

  def loginOAuth(organizationId: Long, username: String, expiredTimeInMs: Option[Long]): Future[LoginResult] = {
    val session =
      caas.loginOAuthToOrg(organizationId, username, expiredTimeInMs.getOrElse(sessionConfig.expiredTimeInMs))
    buildLoginResult(username, session)
  }

  override def loginBySessionId(sessionId: String): Future[LoginResult] = {
    val (username, session) = caas.getUsernameWithSession(sessionId)
    buildLoginResult(username, session)
  }

  private def buildLoginResult(username: String, session: Session): Future[LoginResult] = {
    getUserFromSession(username, session).map(
      LoginResult(
        toCookieInfo(session),
        _,
        toSessionProperties(session)
      )
    )

  }

  private def toSessionProperties(session: Session): Option[Map[String, AnyRef]] = {
    import scala.collection.JavaConversions._
    val map = session.getAttributeKeys
      .filterNot(_ == null)
      .filterNot(_ == SessionInfo.ATTR_USER)
      .map(name => (name.toString -> session.getAttribute(name)))
      .toMap

    Option(map)
  }

  private def toCookieInfo(session: Session): SessionInfo = {
    SessionInfo(
      sessionConfig.key,
      session.getId.toString,
      sessionConfig.domain,
      session.getTimeout,
      Option(session.getStartTimestamp()).filterNot(_ == null).map(_.getTime())
    )
  }

  private def getUserFromSession(username: String, session: Session): Future[User] = {
    val organizationId: Long = toSessionProperties(session)
      .flatMap(_.get(SessionInfo.ATTR_ORGANIZATION_ID))
      .filter(x => x.isInstanceOf[Int] || x.isInstanceOf[Long])
      .map(_.toString.toLong)
      .get
    session.getAttribute(SessionInfo.ATTR_USER) match {
      case user: User => Future.value(user)
      case _ =>
        warn(s"buildLoginResult: read user info from database for $username")
        userService.getUserInfo(organizationId, username)
    }
  }

  override def logout(sessionId: String): Future[Unit] =
    Future {
      caas.logout(sessionId)
    }

  override def deleteUser(organizationId: Long, username: String): Future[Unit] = {
    userService.deleteUser(organizationId, username)
  }

  override def resetUserPassword(organizationId: Long, username: String, newPassword: String): Future[Unit] = {
    userService.resetPassword(organizationId, username, newPassword).unit
  }

  override def updateUserPassword(
      organizationId: Long,
      username: String,
      oldPassword: String,
      newPassword: String
  ): Future[Unit] = {
    userService.updatePassword(organizationId, username, oldPassword, newPassword).unit
  }

  override def getRoles(sessionId: String): Future[Seq[String]] =
    Future {
      caas.getAllRoleNames(sessionId)
    }

  override def hasRole(sessionId: String, roleName: String): Future[Boolean] =
    Future {
      caas.hasRole(sessionId, roleName)
    }

  override def hasRoles(sessionId: String, roleNames: Seq[String]): Future[Map[String, Boolean]] =
    Future {
      val results = caas.hasRoles(sessionId, roleNames)
      roleNames.zip(results).map(e => e._1 -> e._2).toMap
    }

  override def hasAllRoles(sessionId: String, roleNames: Seq[String]): Future[Boolean] =
    Future {
      caas.hasAllRoles(sessionId, roleNames)
    }

  override def isPermitted(sessionId: String, permission: String): Future[Boolean] =
    Future {
      caas.isPermitted(sessionId, permission)
    }

  override def isPermitted(sessionId: String, permissions: Seq[String]): Future[Map[String, Boolean]] =
    Future {
      val results = caas.isPermitted(sessionId, permissions: _*)
      permissions.zip(results).toMap
    }

  override def isPermittedAll(sessionId: String, permissions: Seq[String]): Future[Boolean] =
    Future {
      caas.isPermittedAll(sessionId, permissions: _*)
    }

}
