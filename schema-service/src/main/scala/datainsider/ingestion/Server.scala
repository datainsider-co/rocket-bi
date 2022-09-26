package datainsider.ingestion

import akka.actor.ActorRef
import com.google.inject.Module
import com.google.inject.name.Names
import com.google.inject.util.Modules
import com.twitter.finatra.http.HttpServer
import com.twitter.finatra.http.filters.CommonFilters
import com.twitter.finatra.http.routing.HttpRouter
import com.twitter.finatra.thrift.ThriftServer
import com.twitter.finatra.thrift.routing.ThriftRouter
import com.twitter.util.{Await, Future}
import datainsider.analytics.controller.http.ApiKeyController
import datainsider.analytics.module.{SqlScriptModule, TrackingModule}
import datainsider.analytics.service.TrackingSchemaService
import datainsider.analytics.service.tracking.ApiKeyService
import datainsider.client.filter.{LicenceFilter, LoggedInUserParser, MustLoggedInFilter}
import datainsider.client.module.{
  CaasClientModule,
  HadoopFileClientModule,
  MockCaasClientModule,
  MockHadoopFileClientModule
}
import datainsider.client.service.OrgClientService
import datainsider.client.util.{JsonParser, ZConfig}
import datainsider.data_cook.controller.http.{EtlController, EtlShareController}
import datainsider.data_cook.module.{DataCookJobModule, DataCookModule, DataCookSqlScriptModule, DataCookTestModule}
import datainsider.ingestion.controller.http._
import datainsider.ingestion.controller.http.filter._
import datainsider.ingestion.controller.thrift.TSchemaController
import datainsider.ingestion.domain.{ApiKeyInfo, ApiKeyTypes, CsvSetting, RateLimitingInfo, TableSchema}
import datainsider.ingestion.module.{
  ActorModule,
  MainModule,
  RefreshSchemaModule,
  MockRefreshSchemaModule,
  ShareModule,
  TestModule
}
import datainsider.ingestion.service.CsvReader
import datainsider.ingestion.util.Implicits.FutureEnhance

object MainApp extends Server

class TestServer extends HttpServer {

  override protected def defaultHttpPort: String =
    ZConfig.getString("server.http.port", ":8489")

  override protected def disableAdminHttpServer: Boolean =
    ZConfig.getBoolean("server.admin.disable", default = true)

  override def modules: Seq[com.google.inject.Module] =
    Seq(
      overrideModule(
        super.modules ++ Seq(
          MockCaasClientModule,
          TestModule,
          DataCookTestModule,
          TrackingModule,
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

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .add[PingController]
      .add[SchemaController]
      .add[ShareController]
      .add[IngestionController]
      .add[MustLoggedInFilter, EtlController]
      .add[MustLoggedInFilter, EtlShareController]
      .add[MustLoggedInFilter, SystemInfoController]
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]
  }
}

class Server extends HttpServer with ThriftServer {
  System.setProperty("es.set.netty.runtime.available.processors", "false")

  override protected def defaultHttpPort =
    ZConfig.getString("server.http.port", ":8489")

  override protected def defaultThriftPort: String = ZConfig.getString("server.thrift.port", ":8487")

  override protected def disableAdminHttpServer =
    ZConfig.getBoolean("server.admin.disable", true)

  override def modules: Seq[Module] = {
    Seq(
      MockCaasClientModule,
      MainModule,
      TrackingModule,
      SqlScriptModule,
      ShareModule,
      DataCookModule,
      DataCookSqlScriptModule,
      DataCookJobModule,
      MockHadoopFileClientModule,
      RefreshSchemaModule
    )
  }

  override def messageBodyModule = com.twitter.finatra.MessageBodyModule

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .filter[LicenceFilter]
      .add[PingController]
      .add[SchemaController]
      .add[ShareController]
      .add[IngestionController]
      .add[MustLoggedInFilter, EtlController]
      .add[MustLoggedInFilter, EtlShareController]
      .add[MustLoggedInFilter, SystemInfoController]
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]

    configureTrackingAndAnalyticHttp(router)
  }

  private def configureTrackingAndAnalyticHttp(router: HttpRouter): Unit = {
    router.add[MustLoggedInFilter, ApiKeyController]
  }

  override protected def configureThrift(router: ThriftRouter): Unit = {
    router
      .filter[com.twitter.finatra.thrift.filters.AccessLoggingFilter]
      .add[TSchemaController]
  }

  protected override def postWarmup(): Unit = {
    super.postWarmup()
    warmupCsvReader()
    for {
      _ <- initTrackingAndAnalyticSchema()
      _ <- createDefaultTrackingApiKey()
    } yield Unit
  }

  /**
    *
    * Pre init database schema for report: Clickhouse & SSDB
    *
    * @return
    */
  private def initTrackingAndAnalyticSchema(): Future[Seq[Unit]] = {
    val trackingSchemaService = injector.instance[TrackingSchemaService]
    val organizationService = injector.instance[OrgClientService]

    val orgIds: Seq[Long] = organizationService.getAllOrganizations(0, 1000).syncGet().data.map(_.organizationId)
    Future.traverseSequentially(orgIds)(orgId =>
      trackingSchemaService.initialize(orgId).rescue {
        case e: Throwable =>
          error(s"error when init tracking schema for organization $orgId", e)
          Future.Unit
      }
    )

  }

  private def createDefaultTrackingApiKey(): Future[Boolean] = {
    val apiKeyService = injector.instance[ApiKeyService]
    val apiKey = ZConfig.getString("tracking.default_api_key")

    apiKeyService.addApiKey(
      ApiKeyInfo(
        ApiKeyTypes.Tracking,
        apiKey,
        0L,
        RateLimitingInfo(),
        name = None,
        description = None,
        updatedTime = Some(System.currentTimeMillis()),
        createdTime = Some(System.currentTimeMillis())
      )
    )
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
