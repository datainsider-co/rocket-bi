package co.datainsider.caas.user_caas.module

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.util.ZConfig
import com.google.inject.Provides
import com.twitter.inject.TwitterModule
import co.datainsider.caas.user_caas.domain.SessionConfig
import co.datainsider.caas.user_caas.repository.SessionRepository.RichSessionLike
import co.datainsider.caas.user_caas.repository._
import co.datainsider.caas.user_caas.service.{CaasService, OrgAuthorizationService, _}
import co.datainsider.caas.user_profile.repository.{OrganizationMemberRepository, OrganizationRepository}
import education.x.util.DataSourceBuilder
import org.apache.commons.lang3.SerializationUtils
import org.apache.shiro.SecurityUtils
import org.apache.shiro.authc.credential.CredentialsMatcher
import org.apache.shiro.crypto.hash.Sha256Hash
import org.apache.shiro.mgt.{DefaultSecurityManager, SessionsSecurityManager}
import org.apache.shiro.realm.AuthorizingRealm
import org.apache.shiro.session.Session
import org.apache.shiro.session.mgt.{DefaultSessionManager, SimpleSession, SimpleSessionFactory}
import org.nutz.ssdb4j.spi.SSDB

import javax.inject.{Named, Singleton}
import javax.sql.DataSource

/**
  * @author sonpn
  *  @since 2020 andy
  */

object MockCaasModule extends TwitterModule {}

object CaasModule extends TwitterModule {

  protected override def configure(): Unit = {
    super.configure()

    bindSingleton[CaasService].to[CaasServiceImpl]
    bindSingleton[SessionService].to[SessionServiceImpl]

    bindSingleton[UserService].to[UserServiceImpl]
    bindSingleton[RoleService].to[RoleServiceImpl]
    bindSingleton[OrgAuthorizationService].to[OrgAuthorizationServiceImpl]
  }

  @Singleton
  @Provides
  def providesSessionConfig(): SessionConfig = {
    val expiredTimeInMs = ZConfig.getLong("session.timeout_in_ms")
    val domain = ZConfig.getString("session.domain")
    val key = ZConfig.getString("session.name")

    SessionConfig(key, domain, expiredTimeInMs)

  }

  @Singleton
  @Provides
  def providesSessionDAO(client: SSDB): SessionRepository = {
    SSDBSessionRepository(
      client,
      serializer = (session: Session) => SerializationUtils.serialize(session.toSimpleSession()),
      deserializer = (data: Array[Byte]) => SerializationUtils.deserialize[SimpleSession](data)
    )
  }

  @Singleton
  @Provides
  def providesUserRepository(@Named("mysql") client: JdbcClient): UserRepository = {
    MySqlUserRepository(client)
  }

  @Singleton
  @Provides
  def providesRoleRepository(@Named("mysql") client: JdbcClient): RoleRepository = {
    MySqlRoleRepository(client)
  }

  @Singleton
  @Provides
  def providesHashGenerator(): HashGenerator = {
    PasswordHashGenerator(1, true)
  }

  @Singleton
  @Provides
  def providesCredentialMatcher(): CredentialsMatcher = {
    val matcher = CustomHashedCredentialMatcher(Sha256Hash.ALGORITHM_NAME)
    matcher.setHashIterations(1) // Be careful! Do not change this if you're not sure
    matcher.setStoredCredentialsHexEncoded(true) // Be careful! Do not change this if you're not sure
    matcher
  }

  @Provides
  @Singleton
  def providesDataSource(): DataSource = {
    val jdbcUrl: String = ZConfig.getString("database.mysql.url")
    val username: String = ZConfig.getString("database.mysql.user")
    val password: String = ZConfig.getString("database.mysql.password")
    DataSourceBuilder
      .hikari()
      .driver("com.mysql.cj.jdbc.Driver")
      .jdbcUrl(jdbcUrl)
      .username(username)
      .password(password)
      .build()
  }

  @Singleton
  @Provides
  def providesRealm(
      ds: DataSource,
      userDAO: UserRepository,
      roleDAO: RoleRepository,
      orgDAO: OrganizationRepository,
      orgMemberDAO: OrganizationMemberRepository,
      credentialMatcher: CredentialsMatcher
  ): AuthorizingRealm = {
    val realm = UserPasswordRealm(userDAO, roleDAO, orgDAO, orgMemberDAO)
    realm.setPermissionsLookupEnabled(true)
    realm.setDataSource(ds)
    realm.setCredentialsMatcher(credentialMatcher)
    realm
  }

  @Singleton
  @Provides
  def providesSessionsSecurityManager(
      sessionDAO: SessionRepository,
      realm: AuthorizingRealm
  ): SessionsSecurityManager = {
    val sessionManager = new DefaultSessionManager
    sessionManager.setSessionValidationSchedulerEnabled(false)
    sessionManager.setSessionFactory(new SimpleSessionFactory)
    sessionManager.setSessionDAO(sessionDAO)

    val securityManager = new DefaultSecurityManager(realm)
    securityManager.setSessionManager(sessionManager)
    SecurityUtils.setSecurityManager(securityManager)

    securityManager
  }

}
