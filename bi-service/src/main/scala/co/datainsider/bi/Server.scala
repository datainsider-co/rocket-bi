package co.datainsider.bi

import co.datainsider.bi.controller.http._
import co.datainsider.bi.controller.http.filter.{
  CORSFilter,
  CaseClassExceptionMapping,
  CommonExceptionMapping,
  JsonParseExceptionMapping,
  LicenceFilter
}
import co.datainsider.bi.controller.thrift.TBIServiceController
import co.datainsider.bi.module.{AccessFilterModule, BIServiceModule, TestModule}
import co.datainsider.bi.repository.SchemaManager
import co.datainsider.bi.service.BoostScheduleService
import co.datainsider.bi.util.{LicenceUtils, ZConfig}
import co.datainsider.share.controller.{PermissionTokenController, ShareController}
import co.datainsider.share.module.{MockShareModule, ShareModule}
import com.google.inject.Module
import com.google.inject.util.Modules
import com.twitter.finatra.http.HttpServer
import com.twitter.finatra.http.filters.CommonFilters
import com.twitter.finatra.http.routing.HttpRouter
import com.twitter.finatra.thrift.ThriftServer
import com.twitter.finatra.thrift.routing.ThriftRouter
import com.twitter.util.Await
import datainsider.client.exception.DbExecuteError
import datainsider.client.filter.{LoggedInUserParser, MustLoggedInFilter}
import datainsider.client.module.{CaasClientModule, MockCaasClientModule, MockSchemaClientModule, SchemaClientModule}

/**
  * Created by SangDang on 9/8/
  */
object MainApp extends Server

class Server extends HttpServer with ThriftServer {

  override protected def defaultHttpPort: String = ZConfig.getString("server.http.port", ":8080")

  override protected def defaultThriftPort: String = ZConfig.getString("server.thrift.port", "8084")

  override protected def disableAdminHttpServer: Boolean = ZConfig.getBoolean("server.admin.disable", true)

  override def modules: Seq[Module] =
    Seq(
      BIServiceModule,
      ShareModule,
      CaasClientModule,
      SchemaClientModule,
      AccessFilterModule
    )

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .add[HealthController]
      .add[QueryController]
      .add[DashboardController]
      .add[DirectoryController]
      .add[MustLoggedInFilter, RelationshipController]
      .add[MustLoggedInFilter, PolicyController]
      .add[PermissionTokenController]
      .add[GeolocationController]
      .add[MustLoggedInFilter, ShareController]
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]
  }

  override protected def configureThrift(router: ThriftRouter): Unit = {
    router.add[TBIServiceController]
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

class TestServer extends Server with ThriftServer {

  override def modules: Seq[com.google.inject.Module] =
    Seq(
      overrideModule(
        super.modules ++ Seq(
          TestModule,
          MockShareModule,
          MockCaasClientModule,
          MockSchemaClientModule
        ): _*
      )
    )
}
