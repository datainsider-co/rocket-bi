package datainsider.jobworker

import com.google.inject.Module
import com.google.inject.util.Modules
import com.twitter.finatra.http.HttpServer
import com.twitter.finatra.http.filters.CommonFilters
import com.twitter.finatra.http.routing.HttpRouter
import datainsider.client.filter.{LicenceFilter, LoggedInUserParser}
import datainsider.client.module._
import datainsider.jobworker.controller.http.filter.{
  CORSFilter,
  CaseClassExceptionMapping,
  CommonExceptionMapping,
  JsonParseExceptionMapping
}
import datainsider.jobworker.controller.http.{HealthController, MetadataController, WorkerController}
import datainsider.jobworker.module.{MainModule, TestModule}
import datainsider.jobworker.service.WorkerService
import datainsider.jobworker.util.ZConfig
import datainsider.notification.module.{MockNotificationClientModule, NotificationClientModule}

/**
  * Created by SangDang on 9/8/
  **/
object MainApp extends Server

class TestServer extends Server {

  override def modules: Seq[com.google.inject.Module] =
    Seq(overrideModule(super.modules ++ Seq(TestModule, SchemaClientModule, MockNotificationClientModule): _*))

  private def overrideModule(modules: Module*): Module = {
    if (modules.size == 1) return modules.head

    var module = modules.head
    modules.tail.foreach(m => {
      module = Modules.`override`(module).`with`(m)
    })
    module
  }
}

class Server extends HttpServer {

  override protected def defaultHttpPort: String = ZConfig.getString("server.http.port", ":8080")

  override protected def disableAdminHttpServer: Boolean = ZConfig.getBoolean("server.admin.disable", true)

  override def modules: Seq[Module] =
    Seq(
      MainModule,
      SchemaClientModule,
      CaasClientModule,
      MockLakeClientModule,
      MockHadoopFileClientModule,
      NotificationClientModule
    )

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .add[HealthController]
      .add[WorkerController]
      .add[MetadataController]
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]
  }

  protected override def postWarmup(): Unit = {
    super.postWarmup()
    val workerService = injector.instance[WorkerService]
    workerService.start()
  }

}
