package datainsider.user_caas.module

import com.twitter.inject.TwitterModule
import datainsider.client.filter.UserSessionResolver
import datainsider.user_caas.service.CustomUserSessionResolver

object CustomCaasClientModule extends TwitterModule {

  override def configure(): Unit = {
    super.configure()
    bindSingleton[UserSessionResolver].to[CustomUserSessionResolver]
  }
}
