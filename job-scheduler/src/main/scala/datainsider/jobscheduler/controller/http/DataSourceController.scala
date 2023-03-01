package datainsider.jobscheduler.controller.http

import com.google.inject.Inject
import com.twitter.finatra.http.Controller
import com.twitter.util.Future
import datainsider.client.domain.ThriftImplicit.RichUserProfileLike
import datainsider.client.exception.UnAuthorizedError
import datainsider.client.filter.PermissionFilter
import datainsider.client.service.ProfileClientService
import datainsider.jobscheduler.controller.http.filter.AccessTokenFilter
import datainsider.jobscheduler.domain.DataSource
import datainsider.jobscheduler.domain.request._
import datainsider.jobscheduler.domain.response.DataSourceResponse
import datainsider.jobscheduler.service.DataSourceService

class DataSourceController @Inject() (sourceService: DataSourceService, profileClientService: ProfileClientService, permissionFilter: PermissionFilter)
    extends Controller {

  filter[AccessTokenFilter]
    .filter(permissionFilter.require("ingestion_source:view:[id]"))
    .get("/source/:id") { request: GetDataSourceRequest =>
      val orgId = getOrgId(request.currentOrganizationId)
      sourceService.get(orgId, request.id)
    }

  filter[AccessTokenFilter]
    .get("/source/:id/organization/:org_id") { request: WorkerGetDataSourceRequest =>
      sourceService.get(request.orgId, request.id)
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.require("ingestion_source:view:*"))
    .post("/source/list") { request: PaginationRequest =>
      val orgId = getOrgId(request.currentOrganizationId)
      sourceService
        .list(orgId, request)
        .map(resp => Map("data" -> enhanceWithUserProfile(orgId, resp.data), "total" -> resp.total))
      for {
        resp <- sourceService.list(orgId, request)
        enhancedResponses <- enhanceWithUserProfile(orgId, resp.data)
      } yield Map("data" -> enhancedResponses, "total" -> resp.total)
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.require("ingestion_source:create:*"))
    .post("/source/create") { request: CreateDatasourceRequest =>
      val orgId = getOrgId(request.currentOrganizationId)
      sourceService.create(orgId, request.currentUsername, request.dataSource)
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.require("ingestion_source:delete:[id]"))
    .delete("/source/:id") { request: DeleteDatasourceRequest =>
      val orgId = getOrgId(request.currentOrganizationId)
      sourceService.delete(orgId, request.id).map(success => Map("success" -> success))
    }

  filter[AccessTokenFilter]
    .filter(permissionFilter.require("ingestion_source:edit:[id]"))
    .put("/source/:id") { request: UpdateDataSourceRequest =>
      val orgId = getOrgId(request.currentOrganizationId)
      sourceService.update(orgId, request.dataSource).map(success => Map("success" -> success))
    }

  filter[AccessTokenFilter]
    .post("/fb_ads/token") { request: GetLongLiveAccessTokenRequest =>
      sourceService.getFbAdsLongLiveToken(request.FbAdsToken)
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
