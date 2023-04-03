package datainsider.jobscheduler

import com.google.inject.Module
import com.google.inject.name.Names
import com.google.inject.util.Modules
import com.twitter.finatra.http.HttpServer
import com.twitter.finatra.http.filters.CommonFilters
import com.twitter.finatra.http.routing.HttpRouter
import com.twitter.finatra.thrift.ThriftServer
import com.twitter.finatra.thrift.routing.ThriftRouter
import datainsider.client.filter.{LicenceFilter, LoggedInUserParser, MustLoggedInFilter}
import datainsider.client.module.{CaasClientModule, MockCaasClientModule, MockLakeClientModule, SchemaClientModule}
import datainsider.jobscheduler.controller.http.filter.{
  CORSFilter,
  CaseClassExceptionMapping,
  CommonExceptionMapping,
  JsonParseExceptionMapping
}
import datainsider.jobscheduler.controller.http._
import datainsider.jobscheduler.controller.thrift.TScheduleController
import datainsider.jobscheduler.module.{MainModule, TestModule}
import datainsider.jobscheduler.repository.SchemaManager
import datainsider.jobscheduler.service.ScheduleService
import datainsider.jobscheduler.util.Implicits.FutureEnhance
import datainsider.jobscheduler.util.ZConfig
import datainsider.lakescheduler.controller.http.{LakeHistoryController, LakeJobController, LakeScheduleController}
import datainsider.lakescheduler.module.{LakeJobModule, LakeTestModule}
import datainsider.lakescheduler.service.LakeScheduleService
import datainsider.toolscheduler.controller.http.{ToolHistoryController, ToolJobController, ToolScheduleController}
import datainsider.toolscheduler.module.{ToolJobModule, ToolTestModule}

/**
  * Created by SangDang on 9/8/
  **/
object MainApp extends Server

class TestServer extends Server {

  override def modules: Seq[com.google.inject.Module] =
    Seq(overrideModule(super.modules ++ Seq(TestModule, LakeTestModule, ToolTestModule, MockCaasClientModule): _*))

  private def overrideModule(modules: Module*): Module = {
    if (modules.size == 1) return modules.head

    var module = modules.head
    modules.tail.foreach(m => {
      module = Modules.`override`(module).`with`(m)
    })
    module
  }
}

class Server extends HttpServer with ThriftServer {

  override protected def defaultHttpPort: String = ZConfig.getString("server.http.port", ":8080")

  override protected def defaultThriftPort: String = ZConfig.getString("server.thrift.port", ":8084")

  override protected def disableAdminHttpServer: Boolean = ZConfig.getBoolean("server.admin.disable", true)

  override def modules: Seq[Module] =
    Seq(MainModule, CaasClientModule, SchemaClientModule, LakeJobModule, ToolJobModule, MockLakeClientModule)

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .add[HealthController]
      .add[ScheduleController]
      .add[JobController]
      .add[DataSourceController]
      .add[HistoryController]
      .add[LakeJobController]
      .add[LakeScheduleController]
      .add[LakeHistoryController]
      .add[ToolJobController]
      .add[ToolHistoryController]
      .add[ToolScheduleController]
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]
  }

  protected override def warmup(): Unit = {
    super.warmup()

    val schemaReady = for {
      jobOk <- injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema()
      sourceOk <- injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema()
      historyOk <- injector.instance[SchemaManager](Names.named("history-schema")).ensureSchema()
      lakeJobOk <- injector.instance[SchemaManager](Names.named("lake-job-schema")).ensureSchema()
      lakeHistoryOk <- injector.instance[SchemaManager](Names.named("lake-history-schema")).ensureSchema()
    } yield jobOk && sourceOk && historyOk && lakeJobOk && lakeHistoryOk

    if (!schemaReady.sync()) {
      error("invalid schema")
      println("invalid schema")
      System.exit(1)
    } else println("schema ok")

    val startSchedule: Boolean = ZConfig.getBoolean("schedule_service.enable", default = true)
    if (startSchedule) {
      val scheduleService = injector.instance[ScheduleService]
      scheduleService.start()
      val lakeScheduleService = injector.instance[LakeScheduleService]
      lakeScheduleService.start()
    }
  }

  override protected def configureThrift(router: ThriftRouter): Unit = {
    router.add[TScheduleController]
  }
}
