package co.datainsider.caas.user_caas.module

import com.twitter.inject.TwitterModule
import co.datainsider.caas.user_caas.service.CustomUserSessionResolver
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserSessionResolver

object CustomCaasClientModule extends TwitterModule {

  override def configure(): Unit = {
    super.configure()
    bindSingleton[UserSessionResolver].to[CustomUserSessionResolver]
  }
}
