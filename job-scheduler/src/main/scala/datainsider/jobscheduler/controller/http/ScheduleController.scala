package datainsider.jobscheduler.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.client.filter.{MustLoggedInFilter, PermissionFilter}
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.jobscheduler.controller.http.filter.AccessTokenFilter
import datainsider.jobscheduler.domain.JobProgress
import datainsider.jobscheduler.domain.request.ForceSyncRequest
import datainsider.jobscheduler.domain.response.NextJobResponse
import datainsider.jobscheduler.service.ScheduleService

import javax.inject.Inject

/**
  * Created by SangDang on 9/18/16.
  */
class ScheduleController @Inject() (scheduleService: ScheduleService, permissionFilter: PermissionFilter)
    extends Controller {

  filter[AccessTokenFilter]
    .get("/schedule/job/next") { _: Request =>
      scheduleService.getNextJob.map(jobOpt => NextJobResponse(jobOpt.isDefined, jobOpt))
    }

  filter[AccessTokenFilter]
    .post("/schedule/job/report") { jobProgress: JobProgress =>
      scheduleService.handleJobReport(jobProgress).map(success => Map("success" -> success))
    }

  filter[AccessTokenFilter]
    .get("/schedule/job/progress") { _: Request =>
      scheduleService.getJobProgresses
    }

  filter[AccessTokenFilter]
    .get("/schedule/job/status") { _: Request =>
      scheduleService.status()
    }

  filter[AccessTokenFilter]
    .filter[MustLoggedInFilter]
    .filter(permissionFilter.require("ingestion_job:force_run:[id]"))
    .put("/schedule/job/:id/now") { request: ForceSyncRequest =>
      val jobId = request.id
      val orgId = request.currentOrganizationId.get
      scheduleService.forceSync(orgId, jobId, request.atTime).map(success => Map("success" -> success))
    }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.require("ingestion_job:kill:[id]"))
    .put("/schedule/job/:id/kill") { request: Request =>
      val jobId = request.getLongParam("id")
      val orgId = request.currentOrganizationId.get
      scheduleService.kill(orgId, jobId).map(success => Map("success" -> success))
    }
}
