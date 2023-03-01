package datainsider.lakescheduler.controller.http

import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.client.filter.{MustLoggedInFilter, PermissionFilter}
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.jobscheduler.controller.http.filter.AccessTokenFilter
import datainsider.lakescheduler.domain.LakeJobProgress
import datainsider.lakescheduler.domain.request.ForceRunRequest
import datainsider.lakescheduler.domain.response.NextLakeJobResponse
import datainsider.lakescheduler.service.LakeScheduleService

import javax.inject.Inject

class LakeScheduleController @Inject() (lakeScheduleService: LakeScheduleService, permissionFilter: PermissionFilter) extends Controller {

  filter[AccessTokenFilter]
    .get("/lake/schedule/job/next") { _: Request =>
      lakeScheduleService.getNextJob.map(jobOpt => NextLakeJobResponse(jobOpt.isDefined, jobOpt))
    }

  filter[AccessTokenFilter]
    .post("/lake/schedule/job/report") { jobProgress: LakeJobProgress =>
      lakeScheduleService.reportJob(jobProgress).map(success => Map("success" -> success))
    }

  filter[AccessTokenFilter]
    .post("/lake/schedule/start") { _: Request =>
      lakeScheduleService.start()
    }

  filter[AccessTokenFilter]
    .post("/lake/schedule/stop") { _: Request =>
      lakeScheduleService.stop()
    }

  filter[AccessTokenFilter]
    .get("/lake/schedule/job/progress") { _: Request =>
      lakeScheduleService.getJobProgresses
    }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.require("lake_job:force_run:[id]"))
    .put("/lake/schedule/job/:id/now") { request: ForceRunRequest =>
      val jobId = request.id
      val orgId = request.currentOrganizationId.get
      lakeScheduleService.forceRun(orgId, jobId, request.atTime).map(success => Map("success" -> success))
    }

  filter[MustLoggedInFilter]
    .filter(permissionFilter.require("lake_job:kill:[id]"))
    .put("/lake/schedule/job/:id/kill") { request: Request =>
      val jobId = request.getLongParam("id")
      val orgId = request.currentOrganizationId.get
      lakeScheduleService.killJob(orgId, jobId).map(success => Map("success" -> success))
    }
}
