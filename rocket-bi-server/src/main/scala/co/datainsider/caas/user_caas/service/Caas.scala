package co.datainsider.caas.user_caas.service

import com.twitter.inject.Logging
import co.datainsider.caas.user_profile.domain.user.SessionInfo
import org.apache.shiro.authc.{AuthenticationException, UsernamePasswordToken}
import org.apache.shiro.authz.UnauthenticatedException
import org.apache.shiro.mgt.SessionsSecurityManager
import org.apache.shiro.realm.AuthorizingRealm
import org.apache.shiro.session.Session
import org.apache.shiro.subject.support.DefaultSubjectContext
import org.apache.shiro.subject.Subject
import co.datainsider.caas.user_caas.domain.{OrgAuthenticationToken, OrgPrincipalCollection, OAuthAuthenticationToken}
import co.datainsider.caas.user_caas.repository.UserRepository

import javax.inject.Inject
import scala.collection.JavaConverters.asJavaCollectionConverter
import scala.jdk.CollectionConverters.seqAsJavaListConverter

/**
  * @author sonpn
  * @since 8/6/20 andy
  */
case class Caas @Inject() (
    realm: AuthorizingRealm,
    securityManager: SessionsSecurityManager,
    userRepository: UserRepository
) extends Logging {

  def renewSession(organizationId: Long, oldSessionId: String, sessionTimeout: Long): (String, Session) = {
    val currentUser: Subject = new Subject.Builder(securityManager)
      .sessionId(oldSessionId)
      .buildSubject
    if (currentUser == null)
      throw new UnauthenticatedException("Session is not exist.")

    val username = currentUser.getPrincipal.toString
    val session: Session = currentUser.getSession(true)
    if (session != null) {
      session.setAttribute(SessionInfo.ATTR_USER, userRepository.syncGetUserInfo(organizationId, username))
      session.setTimeout(sessionTimeout)
      session.touch()
    }
    (username, session)
  }

  def loginToOrg(
      organizationId: Long,
      username: String,
      password: String,
      sessionTimeout: Long
  ): Session = {

    val currentSubject: Subject = securityManager.createSubject(new DefaultSubjectContext)
    val token = OrgAuthenticationToken(organizationId, username, password)
    currentSubject.login(token)
    if (!currentSubject.isAuthenticated) {
      throw new AuthenticationException(s"login to organization: $organizationId failed.")
    }
    val session: Session = currentSubject.getSession
    session.setAttribute(SessionInfo.ATTR_USER, userRepository.syncGetUserInfo(organizationId, username))
    session.setAttribute(SessionInfo.ATTR_ORGANIZATION_ID, organizationId)
    session.setTimeout(sessionTimeout)
    session.touch()
    session
  }

  def loginOAuthToOrg(organizationId: Long, username: String, sessionTimeout: Long): Session = {
    val currentSubject: Subject = securityManager.createSubject(new DefaultSubjectContext)
    val token: OAuthAuthenticationToken = OAuthAuthenticationToken(organizationId, username)
    currentSubject.login(token)
    if (!currentSubject.isAuthenticated) {
      throw new AuthenticationException("login failed.")
    }
    val session: Session = currentSubject.getSession
    session.setAttribute(SessionInfo.ATTR_USER, userRepository.syncGetUserInfo(organizationId, username))
    session.setAttribute(SessionInfo.ATTR_ORGANIZATION_ID, organizationId)
    session.setTimeout(sessionTimeout)
    session.touch()
    session
  }

  def logout(sessionId: String): Unit = {
    val currentSubject: Subject = getCurrentSubject(sessionId, false)
    currentSubject.logout()
  }

  def getUsernameWithSession(sessionId: String): (String, Session) = {
    val currentSubject: Subject = getCurrentSubject(sessionId, false)
    if (currentSubject == null || !currentSubject.isAuthenticated)
      throw new UnauthenticatedException("Session expired or not exist")
    val username = currentSubject.getPrincipal.toString
    val session = currentSubject.getSession(false)
    (username, session)
  }

  def getUsername(sessionId: String): String = {
    val currentSubject: Subject = getCurrentSubject(sessionId, false)
    if (currentSubject == null || !currentSubject.isAuthenticated)
      throw new UnauthenticatedException("Session expired or not exist")
    currentSubject.getPrincipal().toString
  }

  def getSession(sessionId: String): Session = {
    val currentSubject = getCurrentSubject(sessionId, false)
    currentSubject.getSession(false)
  }

  private def getCurrentSubject(sessionId: String, needTouch: Boolean = true): Subject = {
    val currentSubject: Subject = new Subject.Builder(securityManager)
      .sessionId(sessionId)
      .buildSubject
    if (currentSubject == null) throw new UnauthenticatedException("Session not exist")
    val session: Session = currentSubject.getSession(false)
    if (session != null && needTouch)
      session.touch()
    currentSubject
  }

  def setSessionAttribute(organizationId: Long, sessionId: String, k: String, v: AnyRef): (String, Session) = {
    val (username, session) = getUsernameWithSession(sessionId)
    session.setAttribute(SessionInfo.ATTR_USER, userRepository.syncGetUserInfo(organizationId, username))
    session.setAttribute(k, v)
    (username, session)
  }

  def isPermitted(sessionId: String, permission: String): Boolean = {
    val currentSubject: Subject = getCurrentSubject(sessionId)
    currentSubject.isPermitted(permission)
  }

  def isPermitted(sessionId: String, permissions: String*): Array[Boolean] = {
    val currentSubject: Subject = getCurrentSubject(sessionId)
    currentSubject.isPermitted(permissions: _*)
  }

  def isPermittedAll(sessionId: String, permissions: String*): Boolean = {
    val currentSubject: Subject = getCurrentSubject(sessionId)
    currentSubject.isPermittedAll(permissions: _*)
  }

  def getAllRoleNames(sessionId: String): Seq[String] = {
    val currentSubject: Subject = getCurrentSubject(sessionId)
    val username = currentSubject.getPrincipal.asInstanceOf[String]
    val organizationId = currentSubject.getPrincipals match {
      case principals: OrgPrincipalCollection => principals.organizationId
      case _                                  => 0
    }

    userRepository.getAllRoleNames(organizationId, username)
  }

  def hasRole(sessionId: String, roleName: String): Boolean = {
    val currentSubject: Subject = getCurrentSubject(sessionId)
    currentSubject.hasRole(roleName)
  }

  def hasRoles(sessionId: String, roleName: Seq[String]): Array[Boolean] = {
    val currentSubject: Subject = getCurrentSubject(sessionId)
    currentSubject.hasRoles(roleName.toList.asJava)
  }

  def hasAllRoles(sessionId: String, roleName: Seq[String]): Boolean = {
    val currentSubject: Subject = getCurrentSubject(sessionId)
    currentSubject.hasAllRoles(roleName.asJavaCollection)
  }

  //ORG
  def hasRole(organizationId: Long, username: String, roleName: String): Boolean = {
    val principal = OrgPrincipalCollection(organizationId, username, "")
    realm.hasRole(principal, roleName)
  }

  def hasRoles(organizationId: Long, username: String, roleName: Seq[String]): Array[Boolean] = {
    val principal = OrgPrincipalCollection(organizationId, username, "")
    realm.hasRoles(principal, roleName.toList.asJava)
  }

  def hasAllRoles(organizationId: Long, username: String, roleName: Seq[String]): Boolean = {
    val principal = OrgPrincipalCollection(organizationId, username, "")
    realm.hasAllRoles(principal, roleName.asJavaCollection)
  }

  def isPermitted(organizationId: Long, username: String, permissions: String): Boolean = {
    val principal = OrgPrincipalCollection(organizationId, username, "")
    realm.isPermitted(principal, permissions)
  }

  def isPermitted(organizationId: Long, username: String, permissions: String*): Array[Boolean] = {
    val principal = OrgPrincipalCollection(organizationId, username, "")
    realm.isPermitted(principal, permissions: _*)
  }

  def isPermittedAll(organizationId: Long, username: String, permissions: String*): Boolean = {
    val principal = OrgPrincipalCollection(organizationId, username, "")
    realm.isPermittedAll(principal, permissions: _*)
  }

}
