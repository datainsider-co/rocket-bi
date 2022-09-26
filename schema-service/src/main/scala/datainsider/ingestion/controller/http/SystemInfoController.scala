package datainsider.ingestion.controller.http

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.client.filter.PermissionFilter
import datainsider.client.filter.UserContext.UserContextSyntax
import datainsider.ingestion.controller.http.requests.TestConnectionRequest
import datainsider.ingestion.domain.RefreshBy
import datainsider.ingestion.service.{RefreshSchemaWorker, SystemService}
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

/**
  * created 2022-07-19 3:33 PM
  *
  * @author tvc12 - Thien Vi
  */
class SystemInfoController @Inject() (filterRequest: PermissionFilter, systemService: SystemService, refreshSchemaWorker: RefreshSchemaWorker)
    extends Controller {
  filter(filterRequest.require("system:view:*"))
    .get("/databases/system/info") { request: Request =>
      Profiler("[ClickhouseSourceController].getSystemInfo") {
        systemService.getSystemInfo(request.getOrganizationId(), true)
      }
    }

  filter(filterRequest.require("system:refresh_schema:*"))
    .post("/databases/system/refresh-schema") { request: Request =>
      Profiler("[ClickhouseSourceController].refreshSchema") {
        refreshSchemaWorker
          .refreshSchema(request.getOrganizationId(), refreshBy = RefreshBy.Manual)
          .map(result => {
            Map("is_success" -> result)
          })
      }
    }

  filter(filterRequest.require("system:view:*"))
    .post("/databases/system/test-connection") { request: TestConnectionRequest =>
      {
        systemService.testConnection(request.getOrganizationId(), request.sourceConfig)
      }
    }

}
