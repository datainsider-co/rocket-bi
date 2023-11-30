package co.datainsider.jobscheduler.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.caas.user_profile.controller.http.filter.{MustLoggedInFilter, PermissionFilter}
import co.datainsider.jobscheduler.controller.http.filter.AccessTokenFilter
import co.datainsider.jobscheduler.domain.JobProgress
import co.datainsider.jobscheduler.domain.request.{ForceSyncRequest, MultiForceSyncRequest}
import co.datainsider.jobscheduler.domain.response.NextJobResponse
import co.datainsider.jobscheduler.service.ScheduleService
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import co.datainsider.license.domain.LicensePermission

import javax.inject.Inject

/**
  * Created by SangDang on 9/18/16.
  */
class ScheduleController @Inject() (scheduleService: ScheduleService, permissionFilter: PermissionFilter)
    extends Controller {

  filter[AccessTokenFilter]
    .get("/schedule/job/next") { _: Request =>
      Profiler("/schedule/job/next") {
        scheduleService.getNextJob.map(jobOpt => NextJobResponse(jobOpt.isDefined, jobOpt))
      }
    }

  filter[AccessTokenFilter]
    .post("/schedule/job/report") { jobProgress: JobProgress =>
      Profiler("/schedule/job/report") {
        scheduleService.handleJobReport(jobProgress).map(success => Map("success" -> success))
      }
    }

  filter[AccessTokenFilter]
    .get("/schedule/job/progress") { _: Request =>
      Profiler("/schedule/job/progress") {
        scheduleService.getJobProgresses
      }
    }

  filter[AccessTokenFilter]
    .get("/schedule/job/status") { _: Request =>
      scheduleService.status()
    }

  filter[AccessTokenFilter]
    .filter[MustLoggedInFilter]
    .filter(permissionFilter.requireAll("ingestion_job:force_run:[id]", LicensePermission.EditData))
    .put("/schedule/job/:id/now") { request: ForceSyncRequest =>
      Profiler("/schedule/job/:id/now") {
        val jobId = request.id
        val orgId = request.currentOrganizationId.get
        scheduleService.forceSync(orgId, jobId, request.startTime).map(success => Map("success" -> success))
      }
    }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.requireAll("ingestion_job:force_run:*", LicensePermission.EditData))
    .put("/schedule/job/multi_sync/now") { request: MultiForceSyncRequest =>
      Profiler("/schedule/job/multi_sync/now") {
        val orgId: Long = request.getOrganizationId()
        scheduleService.multiForceSync(orgId, request.ids, request.startTime)
      }
    }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.requireAll("ingestion_job:kill:[id]", LicensePermission.EditData))
    .put("/schedule/job/:id/kill") { request: Request =>
      Profiler("/schedule/job/:id/kill") {
        val jobId = request.getLongParam("id")
        val orgId = request.currentOrganizationId.get
        scheduleService.kill(orgId, jobId).map(success => Map("success" -> success))
      }
    }
}
