package datainsider.user_profile

import com.google.inject.Module
import com.google.inject.util.Modules
import com.twitter.finatra.http.HttpServer
import com.twitter.finatra.http.filters.CommonFilters
import com.twitter.finatra.http.routing.HttpRouter
import com.twitter.finatra.thrift.ThriftServer
import com.twitter.finatra.thrift.routing.ThriftRouter
import datainsider.admin.module.{AdminAccessFilterModule, AdminAccountModule}
import datainsider.apikey.module.{ApiKeyModule, TestApiKeyModule}
import datainsider.client.filter._
import datainsider.client.module.{BIClientModule, CaasClientModule}
import datainsider.client.util.ZConfig
import datainsider.login_provider.module.{LoginProviderModule, MockLoginProviderModule}
import datainsider.user_caas.module._
import datainsider.user_profile.controller.http._
import datainsider.user_profile.controller.http.filter.common.CORSFilter
import datainsider.user_profile.controller.http.filter.parser.OrganizationParser
import datainsider.user_profile.controller.thrift.CaasController
import datainsider.user_profile.module._

/**
  * Created by SangDang on 9/8/
  * */
object MainApp extends Server {
  def overrideModule(modules: Module*): Module = {
    if (modules.size == 1) return modules.head

    var module = modules.head
    modules.tail.foreach(m => {
      module = Modules.`override`(module).`with`(m)
    })
    module
  }
}

class TestServer extends Server {

  override def modules: Seq[com.google.inject.Module] =
    Seq(
      DBTestModule,
      LoginProviderModule,
      CaasModule,
      UserProfileModule,
      AdminAccessFilterModule,
      MainApp.overrideModule(CaasClientModule, CustomCaasClientModule),
      BIClientModule,
      MockSqlScriptModule,
      TestApiKeyModule
    )
}

class Server extends HttpServer with ThriftServer {

  override protected def defaultHttpPort: String = ZConfig.getString("server.http.port", ":8080")

  override protected def defaultThriftPort: String = ZConfig.getString("server.thrift.port", ":8082")

  override protected def disableAdminHttpServer: Boolean = ZConfig.getBoolean("server.admin.disable", true)

  override def modules: Seq[Module] =
    Seq(
      DBModule,
      SqlScriptModule,
      LoginProviderModule,
      CaasModule,
      UserProfileModule,
//      AdminAccountModule,
      AdminAccessFilterModule,
      MainApp.overrideModule(CaasClientModule, CustomCaasClientModule),
      BIClientModule,
      ApiKeyModule
    )

//  override def messageBodyModule = com.twitter.finatra.DICustomMessageBodyModule

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonShiroExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .add[PingController]
      .add[OrganizationParser, AuthController]
      .add[MustLoggedInFilter, UserProfileController]
      .add[MustLoggedInFilter, PermissionController]
      .add[MustLoggedInFilter, datainsider.admin.controller.http.AdminUserController]
      .add[MustLoggedInFilter, datainsider.admin.controller.http.PermissionController]
      .add[MustLoggedInFilter, datainsider.admin.controller.http.SettingController]
      .add[MustLoggedInFilter, datainsider.apikey.controller.http.ApiKeyController]
      .add[OrganizationController]
  }

  override protected def configureThrift(router: ThriftRouter): Unit = {
    router
      .filter[com.twitter.finatra.thrift.filters.AccessLoggingFilter]
      .add[CaasController]
  }

  override def afterPostWarmup(): Unit = {
    super.afterPostWarmup()
    info("afterPostWarmup")
  }
}
