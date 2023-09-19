package co.datainsider.bi

import co.datainsider.bi.controller.http._
import co.datainsider.bi.controller.http.filter._
import co.datainsider.bi.module.{BIServiceModule, TestContainerModule, TestModule}
import co.datainsider.bi.repository.SchemaManager
import co.datainsider.bi.util.ZConfig
import co.datainsider.caas.admin.controller.http.{
  AdminUserController,
  SettingController,
  PermissionController => AdminPermissionController
}
import co.datainsider.caas.admin.module.AdminAccessFilterModule
import co.datainsider.caas.apikey.controller.http.ApiKeyController
import co.datainsider.caas.apikey.module.{ApiKeyModule, TestApiKeyModule}
import co.datainsider.caas.login_provider.module.LoginProviderModule
import co.datainsider.caas.user_caas.module.CaasModule
import co.datainsider.caas.user_profile.controller.http.filter.parser.{LoggedInUserParser, OrganizationParser}
import co.datainsider.caas.user_profile.controller.http.{
  AuthController,
  OrganizationController,
  PermissionController,
  UserProfileController
}
import co.datainsider.caas.user_profile.module.{SqlScriptModule, _}
import co.datainsider.datacook.controller.http.{DataCookController, ShareDataCookController}
import co.datainsider.datacook.module.{DataCookModule, DataCookSqlScriptModule, TestDataCookModule}
import co.datainsider.datacook.repository.{ETLRepository, HistoryETLRepository}
import co.datainsider.jobscheduler.controller.http.{
  DataSourceController,
  HistoryController,
  JobController,
  ScheduleController
}
import co.datainsider.jobscheduler.module.{JobScheduleClientModule, JobScheduleTestModule, JobSchedulerModule}
import co.datainsider.jobworker.controller.http.{MetadataController, WorkerController}
import co.datainsider.jobworker.module.{JobWorkerModule, JobWorkerTestModule}
import co.datainsider.jobworker.service.WorkerService
import co.datainsider.license.LicenseFilter
import co.datainsider.license.module.{LicenseClientModule, MockLicenseClientModule}
import co.datainsider.schema.controller.http.{IngestionController, SchemaController, SchemaShareController}
import co.datainsider.schema.module._
import co.datainsider.schema.service.RefreshSchemaService
import co.datainsider.share.controller.{PermissionTokenController, ShareController}
import co.datainsider.share.module.{MockShareModule, ShareModule}
import com.google.inject.Module
import com.google.inject.name.Names
import com.google.inject.util.Modules
import com.twitter.finatra.http.HttpServer
import com.twitter.finatra.http.filters.CommonFilters
import com.twitter.finatra.http.routing.HttpRouter
import com.twitter.inject.Injector
import com.twitter.util.{Await, Future}
import datainsider.client.exception.DbExecuteError
import datainsider.client.module.{MockHadoopFileClientModule, MockSchemaClientModule}
import datainsider.notification.module.{MockNotificationClientModule, NotificationClientModule}

/**
  * Created by SangDang on 9/8/
  */
object MainApp extends Server

class Server extends HttpServer {

  override protected def defaultHttpPort: String = ZConfig.getString("server.http.port", ":8080")

  override protected def disableAdminHttpServer: Boolean = ZConfig.getBoolean("server.admin.disable", true)

  override def modules: Seq[Module] =
    Seq(
      MockLicenseClientModule,
      // bi-service modules
      BIServiceModule,
      ShareModule,
      // schema-service modules
      SchemaModule,
      RefreshSchemaModule,
      MockHadoopFileClientModule,
      SchemaClientModule,
      // caas-service modules
      CaasClientModule,
      SqlScriptModule,
      LoginProviderModule,
      CaasModule,
      UserProfileModule,
      ApiKeyModule,
      // job-scheduler modules
      JobSchedulerModule,
      JobScheduleClientModule,
      // job-worker
      JobWorkerModule,
      NotificationClientModule,
      ApiKeyModule,
      // data-cook modules
      DataCookModule,
      DataCookSqlScriptModule
    )

  override protected def configureHttp(router: HttpRouter): Unit = {
    router
      .filter[CORSFilter](beforeRouting = true)
      .filter[CommonFilters]
      .filter[LoggedInUserParser]
      .add[HealthController]
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
      // schedule-service controller
      .add[ScheduleController]
      .add[LicenseFilter, JobController]
      .add[DataSourceController]
      .add[LicenseFilter, HistoryController]
      // job-worker
      .add[LicenseFilter, WorkerController]
      .add[LicenseFilter, MetadataController]
      // data-cook controller
      .add[LicenseFilter, DataCookController]
      .add[LicenseFilter, ShareDataCookController]
      .exceptionMapper[CaseClassExceptionMapping]
      .exceptionMapper[JsonParseExceptionMapping]
      .exceptionMapper[CommonExceptionMapping]
  }

  override protected def warmup(): Unit = {
    super.warmup()
    warmupBiService()
    warmupSchemaService()
    warmupScheduleService()
    injector.instance[WorkerService].start()
    warmupDataCookService()
    println("schema ok!")
  }

  private def warmupBiService(): Unit = {
    val preparedSchema: Future[Unit] = injector.instance[SchemaManager].ensureSchema().map {
      case true  => logger.info("database schema ok")
      case false => throw DbExecuteError("invalid database schema")
    }
    Await.result(preparedSchema)
  }

  private def warmupSchemaService(): Unit = {
    val refreshSchemaService = injector.instance[RefreshSchemaService]
    val isAutoRefreshSchema: Boolean = ZConfig.getBoolean("db.clickhouse.is_auto_refresh_schema", true)
    if (isAutoRefreshSchema) {
      refreshSchemaService.start()
    }
  }

  private def warmupDataCookService(): Unit = {
    fixEtlStatuses(injector)
    import co.datainsider.datacook
    injector.instance[datacook.service.worker.WorkerService].start()
    injector.instance[datacook.service.scheduler.ScheduleService].queueJobs()
  }

  private def warmupScheduleService(): Unit = {
    import co.datainsider.jobscheduler.repository.SchemaManager
    val schemaReady = for {
      jobOk <- injector.instance[SchemaManager](Names.named("job-schema")).ensureSchema()
      sourceOk <- injector.instance[SchemaManager](Names.named("source-schema")).ensureSchema()
      historyOk <- injector.instance[SchemaManager](Names.named("history-schema")).ensureSchema()
    } yield jobOk && sourceOk && historyOk

    if (!Await.result(schemaReady)) {
      logger.error("warnupScheduleService::invalid schema")
      System.exit(1)
    } else {
      logger.info("warnupScheduleService::schema ok")
    }

    val startSchedule: Boolean = ZConfig.getBoolean("schedule_service.enable", default = true)
    if (startSchedule) {
      import co.datainsider.jobscheduler
      val scheduleService = injector.instance[jobscheduler.service.ScheduleService]
      scheduleService.start()
    }
  }

  /**
    * move status from running or queued to terminated
    */
  private def fixEtlStatuses(injector: Injector): Unit = {
    try {
      logger.info("run fix job statuses")
      Await.result(injector.instance[ETLRepository].fixJosStatuses())
      Await.result(injector.instance[HistoryETLRepository].fixJosStatuses())
      logger.info("completed fix job statuses")
    } catch {
      case ex: Throwable => logger.error(s"failed fix job statuses ${ex.getMessage}", ex)
    }
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
          // schema-service modules
          SchemaTestModule,
          MockRefreshSchemaModule,
          MockSchemaClientModule,
          // caas-service modules
          LoginProviderModule,
          CaasModule,
          UserProfileModule,
          AdminAccessFilterModule,
          SqlScriptModule,
          TestApiKeyModule,
          // schedule-service modules
          JobScheduleTestModule,
          // job-worker modules
          JobWorkerTestModule,
          MockNotificationClientModule,
          // test-containers
          TestContainerModule,
          // data-cook modules
          TestDataCookModule
        ): _*
      )
    )
  }

  override def warmup(): Unit = {
    super.warmup()
    MockSqlScriptModule.singletonPostWarmupComplete(injector)
    DataCookSqlScriptModule.singletonPostWarmupComplete(injector)
  }
}
