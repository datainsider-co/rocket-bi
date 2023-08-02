package co.datainsider.jobscheduler.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.jobscheduler.controller.http.filter.AccessTokenFilter
import co.datainsider.jobscheduler.domain.job.{DataDestination, Job}
import co.datainsider.jobscheduler.domain.request._
import co.datainsider.jobscheduler.service.JobService
import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import datainsider.client.exception.{BadRequestError, UnAuthorizedError}
import co.datainsider.license.domain.LicensePermission

class JobController @Inject() (jobService: JobService, permissionFilter: PermissionFilter) extends Controller {

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_job:view:*", LicensePermission.ViewData))
    .post("/job/list") { request: PaginationRequest =>
      Profiler("/job/list") {
        val orgId: Long = getOrgId(request.currentOrganizationId)
        jobService.list(orgId, request)
      }
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_job:create:*", LicensePermission.EditData))
    .post("/job/create") { request: CreateJobRequest =>
      Profiler("/job/create") {
        validateDestinations(request.job)
        val orgId = getOrgId(request.currentOrganizationId)
        jobService.create(orgId, request.currentUsername, request.job)
      }
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_job:create:*", LicensePermission.EditData))
    .post("/job/multi_create") { request: CreateJobFromTableNamesRequest =>
      Profiler("/job/multi_create") {
        validateDestinations(request.baseJob)
        val orgId = getOrgId(request.currentOrganizationId)
        jobService.multiCreate(orgId, request.currentUsername, request.baseJob, request.tableNames)
      }
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_job:create:*", LicensePermission.EditData))
    .post("/job/multi_create_jobs") { request: MultiCreateJobRequest =>
      Profiler("/job/multi_create_jobs") {
        request.jobs.foreach(validateDestinations)
        val orgId: Long = getOrgId(request.currentOrganizationId)
        jobService.multiCreate(orgId, request.currentUsername, request.jobs).map(success => Map("success" -> success))
      }
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_job:delete:[id]", LicensePermission.EditData))
    .delete("/job/:id") { request: DeleteJobRequest =>
      Profiler("/job/:id DELETE") {
        val orgId = getOrgId(request.currentOrganizationId)
        jobService.delete(orgId, request.id).map(success => Map("success" -> success))
      }
    }

  filter(permissionFilter.requireAll("ingestion_job:delete:*", LicensePermission.EditData))
    .delete("/job/multi_delete") { request: MultiDeleteJobRequest =>
      Profiler("/job/multi_delete") {
        val orgId = getOrgId(request.currentOrganizationId)
        jobService.multiDelete(orgId, request.ids).map(success => Map("success" -> success))
      }
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_job:edit:[id]", LicensePermission.EditData))
    .put("/job/:id") { request: UpdateJobRequest =>
      Profiler("/job/:id PUT") {
        validateDestinations(request.job)
        val orgId = getOrgId(request.currentOrganizationId)
        jobService.update(orgId, request).map(success => Map("success" -> success))
      }
    }

  private def getOrgId(orgId: Option[Long]): Long = {
    orgId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError(s"Not found org id: $orgId")
    }
  }

  // TODO: bad code, unable to deserialize DataDestination enum from request :(
  private def validateDestinations(job: Job): Unit = {
    if (job.destinations.isEmpty) {
      throw BadRequestError("job destination can not be empty")
    } else {
      val supportedDestinations: Seq[String] = Seq(DataDestination.Hadoop.toString, DataDestination.Clickhouse.toString)
      if (job.destinations.exists(dest => !supportedDestinations.contains(dest))) {
        throw BadRequestError(s"invalid job destination, possible values are ${supportedDestinations.mkString(", ")}")
      }
    }
  }
}
