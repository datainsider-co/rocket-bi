package datainsider.schema

import com.google.inject.Module
import com.google.inject.util.Modules
import com.twitter.finatra.http.HttpServer
import com.twitter.finatra.http.filters.CommonFilters
import com.twitter.finatra.http.routing.HttpRouter
import com.twitter.finatra.thrift.ThriftServer
import com.twitter.finatra.thrift.routing.ThriftRouter
import com.twitter.util.Await
import datainsider.client.filter.{LicenceFilter, LoggedInUserParser, MustLoggedInFilter}
import datainsider.client.module.{
  CaasClientModule,
  HadoopFileClientModule,
  MockCaasClientModule,
  MockHadoopFileClientModule
}
import datainsider.client.util.ZConfig
import datainsider.schema.controller.http._
import datainsider.schema.controller.http.filter._
import datainsider.schema.controller.thrift.TSchemaController
import datainsider.schema.domain.CsvSetting
import datainsider.schema.module._
import datainsider.schema.service.CsvReader

object MainApp extends Server

class TestServer extends HttpServer {

  override def modules: Seq[com.google.inject.Module] =
    Seq(
      overrideModule(
        super.modules ++ Seq(
          MockCaasClientModule,
          TestModule,
          MockRefreshSchemaModule
        ): _*
      )
    )

  private def overrideModule(modules: Module*): Module = {
    if (modules.size == 1) return modules.head

    var module = modules.head
    modules.tail.foreach(m => {
      module = Modules.`override`(module).`with`(m)
    })
    module
  }

  override protected def defaultHttpPort: String =
    ZConfig.getString("server.http.port", ":8489")

  override protected def disableAdminHttpServer: Boolean =
    ZConfig.getBoolean("server.admin.disable", default = true)

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .add[PingController]
      .add[SchemaController]
      .add[ShareController]
      .add[IngestionController]
      .add[MustLoggedInFilter, SystemInfoController]
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]
  }
}

class Server extends HttpServer with ThriftServer {
  System.setProperty("es.set.netty.runtime.available.processors", "false")

  override def modules: Seq[Module] = {
    Seq(
      CaasClientModule,
      MainModule,
      SqlScriptModule,
      ShareModule,
      MockHadoopFileClientModule,
      RefreshSchemaModule
    )
  }

  override def messageBodyModule = com.twitter.finatra.MessageBodyModule

  override protected def defaultHttpPort =
    ZConfig.getString("server.http.port", ":8489")

  override protected def defaultThriftPort: String = ZConfig.getString("server.thrift.port", ":8487")

  override protected def disableAdminHttpServer =
    ZConfig.getBoolean("server.admin.disable", true)

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .add[PingController]
      .add[SchemaController]
      .add[ShareController]
      .add[IngestionController]
      .add[MustLoggedInFilter, SystemInfoController]
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]
  }

  override protected def configureThrift(router: ThriftRouter): Unit = {
    router
      .filter[com.twitter.finatra.thrift.filters.AccessLoggingFilter]
      .add[TSchemaController]
  }

  protected override def postWarmup(): Unit = {
    super.postWarmup()
    warmupCsvReader()
  }

  private def warmupCsvReader(): Unit = {
    try {
      val dummyData =
        """
          |id,name
          |1,warmup_1
          |2,warmup_2
          |""".stripMargin

      Await.result(CsvReader.detectSchema(dummyData, CsvSetting(includeHeader = true)))
      logger.info("Successful WarmUp CsvReader Module")
    } catch {
      case ex: Throwable => logger.error(s"warmupCsvReader() error: ${ex.getMessage}")
    }
  }

}
