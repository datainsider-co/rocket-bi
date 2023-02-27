package co.datainsider.bi

import co.datainsider.bi.controller.http._
import co.datainsider.bi.controller.http.filter._
import co.datainsider.bi.module.{BIServiceModule, TestModule}
import co.datainsider.bi.repository.SchemaManager
import co.datainsider.bi.service.BoostScheduleService
import co.datainsider.bi.util.ZConfig
import co.datainsider.share.controller.{PermissionTokenController, ShareController}
import co.datainsider.share.module.{MockShareModule, ShareModule}
import com.google.inject.Module
import com.google.inject.util.Modules
import com.twitter.finatra.http.HttpServer
import com.twitter.finatra.http.filters.CommonFilters
import com.twitter.finatra.http.routing.HttpRouter
import com.twitter.util.Await
import datainsider.client.exception.DbExecuteError
import datainsider.client.filter.{LicenceFilter, LoggedInUserParser, MustLoggedInFilter}
import datainsider.client.module.{
  CaasClientModule,
  MockCaasClientModule,
  MockScheduleClientModule,
  MockSchemaClientModule,
  ScheduleClientModule,
  SchemaClientModule
}

/**
  * Created by SangDang on 9/8/
  */
object MainApp extends Server

class Server extends HttpServer {

  override protected def defaultHttpPort: String = ZConfig.getString("server.http.port", ":8080")

  override protected def disableAdminHttpServer: Boolean = ZConfig.getBoolean("server.admin.disable", true)

  override def modules: Seq[Module] =
    Seq(
      BIServiceModule,
      ShareModule,
      CaasClientModule,
      SchemaClientModule,
      // use module for delete or transfer data in job-scheduler
      ScheduleClientModule
    )

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .add[HealthController]
      .add[ShareTokenParser, QueryController]
      .add[ShareTokenParser, DashboardController]
      .add[DirectoryController]
      .add[MustLoggedInFilter, RelationshipController]
      .add[MustLoggedInFilter, RlsPolicyController]
      .add[PermissionTokenController]
      .add[GeolocationController]
      .add[UserActivityController]
      .add[MustLoggedInFilter, ShareController]
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]
  }

  override protected def warmup(): Unit = {

    val preparedSchema = injector.instance[SchemaManager].ensureDatabase().map {
      case true  => println("database schema ok")
      case false => throw DbExecuteError("invalid database schema")
    }
    Await.result(preparedSchema)

    val boostScheduleService = injector.instance[BoostScheduleService]
    boostScheduleService.start()

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

  override def modules: Seq[com.google.inject.Module] =
    Seq(
      overrideModule(
        super.modules ++ Seq(
          TestModule,
          MockShareModule,
          MockCaasClientModule,
          MockSchemaClientModule,
          MockScheduleClientModule
        ): _*
      )
    )
}
