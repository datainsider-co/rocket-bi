package datainsider.jobscheduler.controller.http

import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import datainsider.client.exception.{BadRequestError, UnAuthorizedError}
import datainsider.client.filter.PermissionFilter
import datainsider.jobscheduler.controller.http.filter.AccessTokenFilter
import datainsider.jobscheduler.domain.job.{DataDestination, Job}
import datainsider.jobscheduler.domain.request.{
  CreateJobRequest,
  CreateMultiJobRequest,
  DeleteJobRequest,
  PaginationRequest,
  UpdateJobRequest
}
import datainsider.jobscheduler.service.JobService

class JobController @Inject() (jobService: JobService, permissionFilter: PermissionFilter) extends Controller {

  filter[AccessTokenFilter]
    .filter(permissionFilter.require("ingestion_job:view:*"))
    .post("/job/list") { request: PaginationRequest =>
      val orgId = getOrgId(request.currentOrganizationId)
      jobService.list(orgId, request)
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.require("ingestion_job:create:*"))
    .post("/job/create") { request: CreateJobRequest =>
      validateDestinations(request.job)
      val orgId = getOrgId(request.currentOrganizationId)
      jobService.create(orgId, request.currentUsername, request.job)
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.require("ingestion_job:create:*"))
    .post("/job/multi_create") { request: CreateMultiJobRequest =>
      validateDestinations(request.baseJob)
      val orgId = getOrgId(request.currentOrganizationId)
      jobService.createMultiJob(orgId, request.currentUsername, request.baseJob, request.tableNames)
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.require("ingestion_job:delete:[id]"))
    .delete("/job/:id") { request: DeleteJobRequest =>
      val orgId = getOrgId(request.currentOrganizationId)
      jobService.delete(orgId, request.id).map(success => Map("success" -> success))
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.require("ingestion_job:edit:[id]"))
    .put("/job/:id") { request: UpdateJobRequest =>
      validateDestinations(request.job)
      val orgId = getOrgId(request.currentOrganizationId)
      jobService.update(orgId, request).map(success => Map("success" -> success))
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
