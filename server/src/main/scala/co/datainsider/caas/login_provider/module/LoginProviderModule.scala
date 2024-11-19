package co.datainsider.caas.login_provider.module

import co.datainsider.caas.login_provider.repository.{OAuthConfigRepository, OAuthConfigRepositoryImpl}
import co.datainsider.caas.login_provider.service.{OrgOAuthorizationProvider, OrgOAuthorizationProviderImpl}
import com.google.inject.name.Named
import com.google.inject.{Provides, Singleton}
import com.twitter.inject.TwitterModule

/**
  * @author andy
  */
object LoginProviderModule extends TwitterModule {

  protected override def configure(): Unit = {
    super.configure()
    bind[OAuthConfigRepository].to[OAuthConfigRepositoryImpl].asEagerSingleton()
    bind[OrgOAuthorizationProvider].to[OrgOAuthorizationProviderImpl].asEagerSingleton()
  }

  @Provides
  @Named("whitelist_email_regex_pattern")
  @Singleton
  def providesWhitelistEmail(): Seq[String] = {
    // TODO: fix it
    Seq.empty[String]
  }

}

object MockLoginProviderModule extends TwitterModule {}
