package co.datainsider.datacook.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.datacook.domain.Ids.{EtlJobId, OrganizationId}
import co.datainsider.datacook.domain.request.etl._
import co.datainsider.datacook.domain.response.{EtlDatabaseNameResponse, EtlQueryResponse}
import co.datainsider.datacook.service._
import co.datainsider.datacook.service.metadata.ThirdPartyMetaDataHandler
import co.datainsider.datacook.service.scheduler.ScheduleService
import co.datainsider.datacook.service.worker.WorkerService
import co.datainsider.license.domain.LicensePermission
import co.datainsider.schema.controller.http.filter.AdminSecretKeyFilter
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller

import javax.inject.{Inject, Singleton}

/**
  * @author tvc12 - Thien Vi
  */
@Singleton
class DataCookController @Inject() (
    etlService: ETLService,
    historyService: HistoryETLService,
    shareService: ShareETLService,
    trashService: TrashETLService,
    previewService: ETLPreviewService,
    scheduleService: ScheduleService,
    permissionFilter: PermissionFilter,
    workerService: WorkerService
) extends Controller {

  get("/data_cook/status") { request: Request =>
    {
      workerService.status()
    }
  }

  filter[AdminSecretKeyFilter]
    .post("/data_cook/migrate") { request: Request =>
      {
        for {
          _ <- etlService.migrateData()
          _ <- trashService.migrateData()
        } yield Map("success" -> true)
      }
    }

  post("/data_cook/my_etl") { request: ListEtlJobsRequest =>
    Profiler("/data_cook/my_etl") {
      etlService.listEtlJobs(request.getOrganizationId(), request)
    }
  }

  post("/data_cook/shared") { request: ListEtlJobsRequest =>
    Profiler("/data_cook/shared") {
      shareService.listSharedEtlJobs(request.getOrganizationId(), request)
    }
  }

  post("/data_cook/history") { request: ListEtlJobsRequest =>
    Profiler("/data_cook/history") {
      historyService.listHistories(request.getOrganizationId(), request)
    }
  }

  post("/data_cook/trash") { request: ListEtlJobsRequest =>
    Profiler("/data_cook/trash") {
      trashService.listEtlJobs(request.getOrganizationId(), request)
    }
  }

  filter(permissionFilter.requireAll("etl:view:[id]", LicensePermission.ViewData))
    .get("/data_cook/:id") { request: GetEtlJobRequest =>
      Profiler("/data_cook/:id GET")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.View,
        resourceType = ResourceType.DataCook,
        resourceId = String.valueOf(request.id),
        description = s"view data cook ${request.id}"
      ) {
        etlService.get(request.getOrganizationId(), request.id)
      }
    }

  filter(permissionFilter.requireAll("etl:create:*", LicensePermission.EditData))
    .post("/data_cook/create") { request: CreateEtlJobRequest =>
      Profiler("/data_cook/create")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.DataCook,
        resourceId = null,
        description = s"create data cook '${request.displayName}'"
      ) {
        etlService.create(request.getOrganizationId(), request)
      }
    }

  filter(permissionFilter.requireAll("etl:edit:[id]", LicensePermission.EditData))
    .put("/data_cook/:id") { request: UpdateEtlJobRequest =>
      Profiler("/data_cook/:id PUT")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.DataCook,
        resourceId = String.valueOf(request.id),
        description = s"edit data cook ${request.id}"
      ) {
        etlService.update(request.getOrganizationId(), request)
      }
    }

  filter(permissionFilter.requireAll("etl:delete:[id]", LicensePermission.EditData))
    .delete("/data_cook/:id") { request: DeleteEtlJobRequest =>
      Profiler("/data_cook/:id DELETE")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.DataCook,
        resourceId = String.valueOf(request.id),
        description = s"move data cook ${request.id} to trash"
      ) {
        etlService.softDelete(request.getOrganizationId(), request.id)
      }
    }

  filter(permissionFilter.requireAll("etl:delete:[id]", LicensePermission.EditData))
    .delete("/data_cook/trash/:id") { request: DeleteEtlJobRequest =>
      Profiler("/data_cook/trash/:id DELETE")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.DataCook,
        resourceId = String.valueOf(request.id),
        description = s"delete data cook ${request.id}"
      ) {
        trashService.hardDelete(request.getOrganizationId(), request.id)
      }
    }

  filter(permissionFilter.requireAll("etl:delete:[id]", LicensePermission.EditData))
    .post("/data_cook/trash/:id/restore") { request: RestoreEtlJobRequest =>
      Profiler("/data_cook/trash/:id/restore")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.DataCook,
        resourceId = String.valueOf(request.id),
        description = s"restore data cook ${request.id}"
      ) {
        trashService.restore(request.getOrganizationId(), request.id)
      }
    }

  filter(permissionFilter.requireAll("etl:view:[id]", LicensePermission.ViewData))
    .post("/data_cook/:id/preview_sync") { request: PreviewEtlRequest =>
      Profiler("/data_cook/:id/preview_sync") {
        previewService.previewSync(request.getOrganizationId(), request)
      }
    }

  filter(permissionFilter.requireAll("etl:view:[id]", LicensePermission.ViewData))
    .post("/data_cook/:id/end_preview") { request: EndPreviewEtlJobRequest =>
      Profiler("/data_cook/:id/end_preview") {
        for {
          success <- previewService.endPreview(request.getOrganizationId(), request.id)
        } yield {
          Map("data" -> success)
        }
      }
    }

  filter(permissionFilter.requireAll("etl:view:[id]", LicensePermission.ViewData))
    .get("/data_cook/:id/preview/database_name") { request: GetPreviewDatabaseName =>
      Profiler("/data_cook/:id/preview/database_name") {
        previewService
          .getDatabaseName(request.getOrganizationId(), request.id)
          .map(dbName => EtlDatabaseNameResponse(id = request.id, databaseName = dbName))
      }
    }

  filter(permissionFilter.requireAll("etl:view:[id]", LicensePermission.ViewData))
    .post("/data_cook/:id/view_query") { request: ViewQueryRequest =>
      Profiler("/data_cook/:id/view_query") {
        previewService
          .toQuery(request.getOrganizationId(), request.id, request.fields, request.extraFields)
          .map(query => EtlQueryResponse(id = request.id, query = query))
      }
    }

  get("/data_cook/scheduler/status") { request: Request =>
    scheduleService.getJobProgresses
  }

  // fixme: missing id in request
  post("/data_cook/third_party/database/list") { request: ListThirdPartyDatabaseRequest =>
    {
      val handler = ThirdPartyMetaDataHandler(request.configuration.toOperator(0))
      handler.listDatabases()
    }
  }

  // fixme: missing id in request
  post("/data_cook/third_party/table/list") { request: ListThirdPartyTableRequest =>
    {
      val handler = ThirdPartyMetaDataHandler(request.configuration.toOperator(0))
      handler.listTables(request.databaseName)
    }
  }

  filter(permissionFilter.requireAll("etl:kill:[id]", LicensePermission.EditData))
    .put("/data_cook/:id/kill") { request: Request =>
      Profiler("/data_cook/:id/kill") {
        val jobId: EtlJobId = request.getLongParam("id")

        UserActivityTracker(
          request = request.request,
          actionName = request.getClass.getSimpleName,
          actionType = ActionType.Update,
          resourceType = ResourceType.DataCook,
          resourceId = String.valueOf(jobId),
          description = s"kill data cook job ${jobId}"
        ) {
          val ordId: OrganizationId = request.getOrganizationId()
          scheduleService.killJob(ordId, jobId).map(_ => Map("success" -> true))
        }
      }
    }

  filter(permissionFilter.requireAll("etl:force_run:[id]", LicensePermission.EditData))
    .put("/data_cook/:id/force_run") { request: ForceRunRequest =>
      Profiler("/data_cook/:id/force_run")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.DataCook,
        resourceId = String.valueOf(request.id),
        description = s"force run data cook job ${request.id}"
      ) {
        scheduleService
          .forceRun(request.getOrganizationId(), request.id, request.atTime)
          .map(_ => Map("success" -> true))
      }
    }
}
