package datainsider.analytics.controller.http

import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import datainsider.analytics.controller.http.request.{
  GetJobRequest,
  GetScheduleRequest,
  ListJobRequest,
  RunReportRequest
}
import datainsider.analytics.service.{JobInfoService, JobManagementService}

@deprecated("no longer use")
case class JobController @Inject() (
    jobInfoService: JobInfoService,
    managementService: JobManagementService
) extends Controller {

  get("/analytics/jobs/schedules") { request: GetScheduleRequest =>
    managementService.getSchedules(request.from, request.size)
  }

  post("/analytics/jobs") { request: RunReportRequest =>
    managementService.schedule(request)
  }

  get("/analytics/jobs") { request: ListJobRequest =>
    jobInfoService.list(request.from, request.size)
  }

  get("/analytics/jobs/:job_id") { request: GetJobRequest =>
    jobInfoService.getJobInfo(request.jobId)
  }

}
