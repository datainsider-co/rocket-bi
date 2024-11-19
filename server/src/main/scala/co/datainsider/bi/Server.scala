package co.datainsider.bi

import co.datainsider.bi.controller.http._
import co.datainsider.bi.controller.http.filter._
import co.datainsider.bi.module._
import co.datainsider.bi.repository.SchemaManager
import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.admin.controller.http.{AdminUserController, SettingController, PermissionController => AdminPermissionController}
import co.datainsider.caas.admin.module.AdminAccessFilterModule
import co.datainsider.caas.apikey.controller.http.ApiKeyController
import co.datainsider.caas.apikey.module.{ApiKeyModule, TestApiKeyModule}
import co.datainsider.caas.login_provider.module.LoginProviderModule
import co.datainsider.caas.user_caas.module.CaasModule
import co.datainsider.caas.user_profile.controller.http.filter.parser.{LoggedInUserParser, OrganizationParser}
import co.datainsider.caas.user_profile.controller.http.{AuthController, OrganizationController, PermissionController, UserProfileController}
import co.datainsider.caas.user_profile.module.{SqlScriptModule, _}
import co.datainsider.common.client.exception.DbExecuteError
import co.datainsider.license.LicenseFilter
import co.datainsider.license.module.MockLicenseClientModule
import co.datainsider.schema.controller.http.{IngestionController, SchemaController, SchemaShareController}
import co.datainsider.schema.module._
import co.datainsider.share.controller.{PermissionTokenController, ShareController}
import co.datainsider.share.module.{MockShareModule, ShareModule}
import com.google.inject.Module
import com.google.inject.util.Modules
import com.twitter.finatra.http.HttpServer
import com.twitter.finatra.http.filters.CommonFilters
import com.twitter.finatra.http.routing.HttpRouter
import com.twitter.util.{Await, Future}

/**
  * Created by SangDang on 9/8/
  */
object MainApp extends Server

class Server extends HttpServer {

  override protected def defaultHttpPort: String = ZConfig.getString("server.default.http_port", ":8080")

  override protected def disableAdminHttpServer: Boolean = ZConfig.getBoolean("server.default.admin_disable", true)

  override def modules: Seq[Module] =
    Seq(
      MockLicenseClientModule,
      CommonModule,
      // bi-service modules
      BIServiceModule,
      BIClientModule,
      ShareModule,
      // schema-service modules
      SchemaModule,
      RefreshSchemaModule,
      // caas-service modules
      CaasClientModule,
      SqlScriptModule,
      LoginProviderModule,
      CaasModule,
      UserProfileModule,
      ApiKeyModule
    )

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .add[HealthController]
      .add[ContactUsController]
      .add[ShareTokenParser, LicenseFilter, QueryController]
      .add[ShareTokenParser, LicenseFilter, DashboardController]
      .add[ShareTokenParser, LicenseFilter, DirectoryController]
      .add[LicenseFilter, RelationshipController]
      .add[LicenseFilter, RlsPolicyController]
      .add[PermissionTokenController]
      .add[GeolocationController]
      .add[UserActivityController]
      .add[LicenseFilter, ShareController]
      .add[LicenseFilter, SchemaController]
      .add[LicenseFilter, SchemaShareController]
      .add[LicenseFilter, IngestionController]
      // caas-service controller
      .add[OrganizationParser, AuthController]
      .add[LicenseFilter, UserProfileController]
      .add[LicenseFilter, PermissionController]
      .add[LicenseFilter, SettingController]
      .add[LicenseFilter, ApiKeyController]
      .add[LicenseFilter, AdminUserController]
      .add[LicenseFilter, AdminPermissionController]
      .add[OrganizationController]
      .add[LicenseFilter, ConnectionController]
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]
  }

  override protected def warmup(): Unit = {
    super.warmup()
    warmupBiService()
    println("schema ok!")
  }

  private def warmupBiService(): Unit = {
    val preparedSchema: Future[Unit] = injector.instance[SchemaManager].ensureSchema().map {
      case true  => logger.info("database schema ok")
      case false => throw DbExecuteError("invalid database schema")
    }
    Await.result(preparedSchema)
  }

  protected def overrideModule(modules: Module*): Module = {
    if (modules.size == 1) return modules.head

    var module = modules.head
    modules.tail.foreach(m => {
      module = Modules.`override`(module).`with`(m)
    })
    module
  }

}

class TestServer extends Server {

  override def modules: Seq[com.google.inject.Module] = {
    Seq(
      overrideModule(
        super.modules ++ Seq(
          MockLicenseClientModule,
          MockCaasClientModule,
          // bi-service modules
          TestModule,
          MockShareModule,
          MockBIClientModule,
          // schema-service modules
          SchemaTestModule,
          MockRefreshSchemaModule,
          // caas-service modules
          LoginProviderModule,
          CaasModule,
          UserProfileModule,
          AdminAccessFilterModule,
          SqlScriptModule,
          TestApiKeyModule,
          // schedule-service modules
//          JobScheduleTestModule,
          // job-worker modules
//          JobWorkerTestModule,
          // test-containers
          TestContainerModule
          // data-cook modules
//          TestDataCookModule
        ): _*
      )
    )
  }

  override def warmup(): Unit = {
    super.warmup()
    MockSqlScriptModule.singletonPostWarmupComplete(injector)
//    DataCookSqlScriptModule.singletonPostWarmupComplete(injector)
  }
}
