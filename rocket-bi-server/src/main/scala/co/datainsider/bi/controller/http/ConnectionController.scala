package co.datainsider.bi.controller.http

import co.datainsider.bi.domain.request.{GetConnectionRequest, SetConnectionRequest, TestConnectionRequest}
import co.datainsider.bi.domain.response.PublicKeyResponse
import co.datainsider.bi.service.{ConnectionService, SshKeyService}
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.caas.user_profile.controller.http.filter.parser.UserContext.UserContextSyntax
import co.datainsider.schema.controller.http.filter.AdminSecretKeyFilter
import co.datainsider.schema.service.RefreshSchemaService
import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.util.{Future, Return}

class ConnectionController @Inject() (
    connectionService: ConnectionService,
    refreshSchemaService: RefreshSchemaService,
    permissionFilter: PermissionFilter,
    sshKeyService: SshKeyService
) extends Controller {
  get("/connection") { request: GetConnectionRequest =>
    Profiler("/connection GET") {
      val orgId: Long = request.getOrganizationId()
      connectionService.getOriginConnection(orgId)
    }
  }

  get("/connection/exist") { request: GetConnectionRequest =>
    Profiler("/connection/exist GET") {
      val orgId: Long = request.getOrganizationId()
      connectionService.exist(orgId).map(existed => Map("existed" -> existed))
    }
  }

  filter(permissionFilter.require("organization:manage:connection"))
    .post("/connection") { request: SetConnectionRequest =>
      Profiler("/connection POST") {
        val orgId: Long = request.getOrganizationId()
        connectionService.set(orgId, request.source)
      }
    }

  filter(permissionFilter.require("organization:manage:connection"))
    .delete("/connection") { request: Request =>
      Profiler("/connection DELETE") {
        val orgId: Long = request.getOrganizationId()
        connectionService.delete(orgId)
      }
    }

  filter(permissionFilter.require("organization:manage:connection"))
    .post("/connection/test") { request: TestConnectionRequest =>
      Profiler("/connection/test POST") {
        val orgId: Long = request.getOrganizationId()
        connectionService.test(orgId, request.source).map(success => Map("success" -> success))
      }
    }

  filter(permissionFilter.require("organization:manage:connection"))
    .post("/connection/refresh-schema") { request: Request =>
      Profiler("/connection/refresh-schema POST") {
        val orgId: Long = request.getOrganizationId()
        refreshSchemaService
          .forceRefreshSchema(orgId, request.currentUsername)
          .map(success => Map("success" -> success))
      }
    }

  filter(permissionFilter.require("organization:manage:connection"))
    .get("/connection/refresh-schema/status") { request: Request =>
      Profiler("/connection/refresh-schema/status GET") {
        val orgId: Long = request.getOrganizationId()
        refreshSchemaService.getRefreshHistory(orgId)
      }
    }

  filter(permissionFilter.require("organization:manage:connection"))
    .post("/connection/refresh-schema/stop") { request: Request =>
      Profiler("/connection/refresh-schema/stop POST") {
        val orgId: Long = request.getOrganizationId()
        refreshSchemaService.syncStopRefreshSchema(orgId).map(success => Map("success" -> success))
      }
    }

  filter[AdminSecretKeyFilter]
    .get("/connection/refresh-schema/worker/status") { request: Request =>
      Profiler("/connection/refresh-schema/worker/status GET") {
        refreshSchemaService.getWorkerStatus()
      }
    }

  filter(permissionFilter.require("organization:manage:connection"))
    .get("/connection/ssh/public-key") {
      Profiler("/connection/ssh/public-key GET") { request: Request => {
          val orgId: Long = request.getOrganizationId()
          sshKeyService.getKeyPair(orgId).transform {
            case Return(keyPair) => Future.value(PublicKeyResponse(isExists = true, Some(keyPair.publicKey)))
            case _               => Future.value(PublicKeyResponse(isExists = false))
          }
        }
      }
    }

  filter(permissionFilter.require("organization:manage:connection"))
    .post("/connection/ssh/generate-key") {
      Profiler("/connection/ssh/generate-key POST") { request: Request => {
          val orgId: Long = request.getOrganizationId()
          sshKeyService.createKey(orgId).map(isSuccess => Map("success" -> isSuccess))
        }
      }
    }
}
