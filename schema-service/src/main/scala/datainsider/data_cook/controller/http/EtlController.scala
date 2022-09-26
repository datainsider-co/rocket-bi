package datainsider.data_cook.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.client.filter.PermissionFilter
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.data_cook.domain.EtlJob.ActionConfiguration2Operator
import datainsider.data_cook.domain.Ids.{EtlJobId, OrganizationId}
import datainsider.data_cook.domain.request.EtlRequest._
import datainsider.data_cook.domain.response.{EtlDatabaseNameResponse, EtlQueryResponse}
import datainsider.data_cook.service._
import datainsider.data_cook.service.metadata.ThirdPartyMetaDataHandler
import datainsider.data_cook.service.scheduler.ScheduleService
import datainsider.data_cook.service.worker.WorkerService
import datainsider.ingestion.controller.http.filter.AdminSecretKeyFilter
import datainsider.profiler.Profiler

import javax.inject.{Inject, Singleton}
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author tvc12 - Thien Vi
  * */
@Singleton
class EtlController @Inject() (
    jobService: EtlJobService,
    historyService: EtlJobHistoryService,
    shareService: EtlShareService,
    trashService: TrashEtlJobService,
    previewJobService: PreviewEtlJobService,
    scheduleService: ScheduleService,
    permissionFilter: PermissionFilter,
    workerService: WorkerService
) extends Controller {

  filter[AdminSecretKeyFilter]
  .get("/data_cook/status") {
    request: Request => {
      workerService.status()
    }
  }

  filter[AdminSecretKeyFilter]
    .post("/data_cook/migrate") {
      request: Request => {
        for {
          _ <- jobService.migrateData()
          _ <- trashService.migrateData()
        } yield Map("success" -> true)
      }
    }

  post("/data_cook/my_etl") { request: ListEtlJobsRequest =>
    Profiler("[DataCook]::my_etl") {
      jobService.listEtlJobs(request.currentOrganizationId.get, request)
    }
  }

  post("/data_cook/shared") { request: ListEtlJobsRequest =>
    Profiler("[DataCook]::shared") {
      shareService.listSharedEtlJobs(request.currentOrganizationId.get, request)
    }
  }

  post("/data_cook/history") { request: ListEtlJobsRequest =>
    Profiler("[DataCook]::history") {
      historyService.listHistories(request.currentOrganizationId.get, request)
    }
  }

  post("/data_cook/trash") { request: ListEtlJobsRequest =>
    Profiler("[DataCook]::trash") {
      trashService.listEtlJobs(request.currentOrganizationId.get, request)
    }
  }

  filter(permissionFilter.require("etl:view:[id]"))
    .get("/data_cook/:id") { request: GetEtlJobRequest =>
      Profiler("[DataCook]::get_etl") {
        jobService.get(request.currentOrganizationId.get, request.id)
      }
    }

  filter(permissionFilter.require("etl:create:*"))
    .post("/data_cook/create") { request: CreateEtlJobRequest =>
      Profiler("[DataCook]::create_etl") {
        jobService.create(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.require("etl:edit:[id]"))
    .put("/data_cook/:id") { request: UpdateEtlJobRequest =>
      Profiler("[DataCook]::update_etl") {
        jobService.update(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.require("etl:delete:[id]"))
    .delete("/data_cook/:id") { request: DeleteEtlJobRequest =>
      Profiler("[DataCook]::soft_delete") {
        jobService.softDelete(request.currentOrganizationId.get, request.id)
      }
    }

  filter(permissionFilter.require("etl:delete:[id]"))
    .delete("/data_cook/trash/:id") { request: DeleteEtlJobRequest =>
      Profiler("[DataCook]::hard_delete") {
        trashService.hardDelete(request.currentOrganizationId.get, request.id)
      }
    }

  filter(permissionFilter.require("etl:delete:[id]"))
    .post("/data_cook/trash/:id/restore") { request: RestoreEtlJobRequest =>
      Profiler("[DataCook]::restore_etl") {
        trashService.restore(request.currentOrganizationId.get, request.id)
      }
    }

  filter(permissionFilter.require("etl:view:[id]"))
    .post("/data_cook/:id/preview_sync") { request: PreviewEtlRequest =>
      Profiler("[DataCook]::preview_etl_sync") {
        previewJobService.previewSync(request.currentOrganizationId.get, request)
      }
    }

  filter(permissionFilter.require("etl:view:[id]"))
    .post("/data_cook/:id/end_preview") { request: EndPreviewEtlJobRequest =>
      Profiler("[DataCook]::end_preview") {
        for {
          success <- previewJobService.endPreview(request.currentOrganizationId.get, request.id)
        } yield {
          Map("data" -> success)
        }
      }
    }

  filter(permissionFilter.require("etl:view:[id]"))
    .get("/data_cook/:id/preview/database_name") { request: GetPreviewDatabaseName =>
      Profiler("[DataCook]::database_name") {
        previewJobService
          .getDatabaseName(request.currentOrganizationId.get, request.id)
          .map(dbName => EtlDatabaseNameResponse(id = request.id, databaseName = dbName))
      }
    }

  filter(permissionFilter.require("etl:view:[id]"))
    .post("/data_cook/:id/view_query") { request: ViewQueryRequest =>
      Profiler("[DataCook]::view_query") {
        previewJobService
          .toQuery(request.currentOrganizationId.get, request.id, request.fields, request.extraFields)
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

  filter(permissionFilter.require("etl:kill:[id]"))
    .put("/data_cook/:id/kill") { request: Request =>
      {
        val jobId: EtlJobId = request.getLongParam("id")
        val ordId: OrganizationId = request.currentOrganizationId.get
        scheduleService.killJob(ordId, jobId).map(_ => Map("success" -> true))
      }
    }

  filter(permissionFilter.require("etl:force_run:[id]"))
    .put("/data_cook/:id/force_run") { request: ForceRunRequest =>
      {
        scheduleService
          .forceRun(request.currentOrganizationId.get, request.id, request.atTime)
          .map(_ => Map("success" -> true))
      }
    }
}
