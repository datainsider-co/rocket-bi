package co.datainsider.jobscheduler.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.client.ProfileClientService
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.jobscheduler.controller.http.filter.AccessTokenFilter
import co.datainsider.jobscheduler.domain.request._
import co.datainsider.jobscheduler.domain.response.DataSourceResponse
import co.datainsider.jobscheduler.domain.source.DataSource
import co.datainsider.jobscheduler.service.DataSourceService
import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import com.twitter.util.Future
import datainsider.client.domain.ThriftImplicit.RichUserProfileLike
import datainsider.client.exception.UnAuthorizedError
import co.datainsider.license.domain.LicensePermission

class DataSourceController @Inject() (
    sourceService: DataSourceService,
    profileClientService: ProfileClientService,
    permissionFilter: PermissionFilter
) extends Controller {

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_source:view:[id]", LicensePermission.ViewData))
    .get("/source/:id") { request: GetDataSourceRequest =>
      Profiler("/source/:id GET") {
        val orgId = getOrgId(request.currentOrganizationId)
        sourceService.get(orgId, request.id)
      }
    }

  filter[AccessTokenFilter]
    .get("/source/:id/organization/:org_id") { request: WorkerGetDataSourceRequest =>
      Profiler("/source/:id/organization/:org_id") {
        sourceService.get(request.orgId, request.id)
      }
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_source:view:*", LicensePermission.ViewData))
    .post("/source/list") { request: PaginationRequest =>
      Profiler("/source/list") {
        val orgId = getOrgId(request.currentOrganizationId)
        sourceService
          .list(orgId, request)
          .map(resp => Map("data" -> enhanceWithUserProfile(orgId, resp.data), "total" -> resp.total))
        for {
          resp <- sourceService.list(orgId, request)
          enhancedResponses <- enhanceWithUserProfile(orgId, resp.data)
        } yield Map("data" -> enhancedResponses, "total" -> resp.total)
      }
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_source:create:*", LicensePermission.EditData))
    .post("/source/create") { request: CreateDatasourceRequest =>
      Profiler("/source/create") {
        val orgId = getOrgId(request.currentOrganizationId)
        sourceService.create(orgId, request.currentUsername, request.dataSource)
      }
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_source:delete:[id]", LicensePermission.EditData))
    .delete("/source/:id") { request: DeleteDatasourceRequest =>
      Profiler("/source/:id DELETE") {
        val orgId = getOrgId(request.currentOrganizationId)
        sourceService.delete(orgId, request.id).map(success => Map("success" -> success))
      }
    }

  filter(permissionFilter.requireAll("ingestion_source:delete:*", LicensePermission.EditData))
    .delete("/source/multi_delete") { request: MultiDeleteDatasourceRequest =>
      Profiler("/source/multi_delete") {
        val orgId = getOrgId(request.currentOrganizationId)
        sourceService.multiDelete(orgId, request.ids).map(success => Map("success" -> success))
      }
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.requireAll("ingestion_source:edit:[id]", LicensePermission.EditData))
    .put("/source/:id") { request: UpdateDataSourceRequest =>
      Profiler("/source/:id PUT") {
        val orgId = getOrgId(request.currentOrganizationId)
        sourceService.update(orgId, request.dataSource).map(success => Map("success" -> success))
      }
    }

  private def enhanceWithUserProfile(orgId: Long, dataSources: Seq[DataSource]): Future[Seq[DataSourceResponse]] = {
    val creatorIds: Seq[String] = dataSources.map(_.getCreatorId).distinct
    profileClientService
      .getUserProfiles(orgId, creatorIds)
      .map(profileMap => {
        dataSources.map(dataSource =>
          DataSourceResponse(
            dataSource = dataSource,
            creator = profileMap.get(dataSource.getCreatorId).map(_.toShortUserProfile)
          )
        )
      })
  }

  private def getOrgId(orgId: Option[Long]): Long = {
    orgId match {
      case Some(value) => value
      case None        => throw UnAuthorizedError("Not found org id")
    }
  }
}
