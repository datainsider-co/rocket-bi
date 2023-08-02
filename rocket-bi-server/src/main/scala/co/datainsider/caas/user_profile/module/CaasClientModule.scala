package co.datainsider.caas.user_profile.module

import co.datainsider.caas.user_profile.client.{
  CaasClientService,
  CaasClientServiceImpl,
  MockCaasClientServiceImpl,
  MockOrgAuthorizationClientServiceImpl,
  MockOrgClientServiceImpl,
  MockProfileClientServiceImpl,
  OrgAuthorizationClientService,
  OrgAuthorizationClientServiceImpl,
  OrgClientService,
  OrgClientServiceImpl,
  ProfileClientService,
  ProfileClientServiceImpl
}
import co.datainsider.caas.user_profile.controller.http.filter.parser.{
  DefaultUserSessionResolver,
  MockUserSessionResolver,
  UserSessionResolver
}
import com.twitter.inject.TwitterModule

object CaasClientModule extends TwitterModule {

  override def configure(): Unit = {
    super.configure()

    bind[ProfileClientService].to[ProfileClientServiceImpl].asEagerSingleton()
    bind[UserSessionResolver].to[DefaultUserSessionResolver].asEagerSingleton()
    bind[OrgClientService].to[OrgClientServiceImpl].asEagerSingleton()
    bind[CaasClientService].to[CaasClientServiceImpl].asEagerSingleton()
    bind[OrgAuthorizationClientService].to[OrgAuthorizationClientServiceImpl].asEagerSingleton()
  }

}

object MockCaasClientModule extends TwitterModule {

  override def configure(): Unit = {
    super.configure()

    bind[ProfileClientService].to[MockProfileClientServiceImpl].asEagerSingleton()
    bind[CaasClientService].to[MockCaasClientServiceImpl].asEagerSingleton()
    bind[OrgClientService].to[MockOrgClientServiceImpl].asEagerSingleton()

    bind[OrgAuthorizationClientService].to[MockOrgAuthorizationClientServiceImpl].asEagerSingleton()
    bind[UserSessionResolver].to[MockUserSessionResolver].asEagerSingleton()
  }

}
