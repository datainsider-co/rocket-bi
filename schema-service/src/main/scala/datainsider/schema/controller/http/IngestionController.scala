package datainsider.schema.controller.http

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import datainsider.client.filter.PermissionFilter
import datainsider.profiler.Profiler
import datainsider.schema.controller.http.filter.{ApiKeyFilter, ServiceKeyFilter}
import datainsider.schema.controller.http.requests._
import datainsider.schema.domain._
import datainsider.schema.service._

import scala.concurrent.ExecutionContext.Implicits.global

case class IngestionController @Inject() (
    ingestionService: IngestionService,
    oldCsvUploadService: OldCsvUploadService,
    csvIngestionService: CsvIngestionService,
    syncInfoService: FileSyncInfoService,
    syncHistoryService: FileSyncHistoryService,
    schemaService: SchemaService,
    permissionFilter: PermissionFilter
) extends Controller {

  filter[ServiceKeyFilter]
    .post("/ingestion/properties") { request: IngestRequest =>
      ingestionService.ingest(request)
    }

  filter[ServiceKeyFilter]
    .post("/ingestion/ensure_schema") { request: EnsureSparkSchemaRequest =>
      ingestionService.ensureSchema(request)
    }

  filter[ServiceKeyFilter]
    .post("/ingestion/optimize_table") { request: OptimizeTableRequest =>
      {
        for {
          result <- schemaService.optimizeTable(
            request.organizationId,
            request.dbName,
            request.tblName,
            request.primaryKeys,
            request.isUseFinal
          )
        } yield Map("data" -> result)
      }
    }

  filter[ServiceKeyFilter]
    .delete("/ingestion/:db_name/:tbl_name") { request: ClearTableRequest =>
      ingestionService.clearTable(request)
    }

  filter[ServiceKeyFilter]
    .post("/ingestion/generate") { request: IngestFakeDataRequest =>
      ingestionService.ingest(request)
    }

  filter[ServiceKeyFilter]
    .post("/ingestion/csv/register") { request: OldCsvRegisterRequest =>
      oldCsvUploadService.register(request)
    }

  filter[ServiceKeyFilter]
    .post("/ingestion/csv/preview") { request: DetectCsvSchemaRequest =>
      oldCsvUploadService.preview(request)
    }

  filter[ServiceKeyFilter]
    .post("/ingestion/csv/upload") { request: OldCsvUploadRequest =>
      oldCsvUploadService.uploadBatch(request)
    }

  post("/ingestion/csv/schema") { request: RegisterCsvSchemaRequest =>
    csvIngestionService.registerSchema(request)
  }

  post("/ingestion/csv/detect") { request: DetectCsvSchemaRequest =>
    csvIngestionService.detectSchema(request)
  }

  filter(permissionFilter.require("database:edit:*"))
    .post("/ingestion/csv") { request: IngestCsvRequest =>
      csvIngestionService.ingestCsv(request)
    }

  filter(permissionFilter.require("database:edit:*"))
    .post("/ingestion/batch") { request: IngestBatchRequest =>
      ingestionService.ingest(request.dbName, request.tblName, request.records)
    }

  get("/ingestion/file/sync/list") { request: Request =>
    val from = request.getIntParam("from")
    val size = request.getIntParam("size")
    syncInfoService.list(from, size)
  }

  get("/ingestion/file/sync/history") { request: Request =>
    val from = request.getIntParam("from")
    val size = request.getIntParam("size")
    syncHistoryService.list(from, size)
  }

  filter[ApiKeyFilter]
    .post("/ingestion/file/sync/start") { request: InitSyncRequest =>
      Profiler("[FileUpload]::start_sync") {
        syncInfoService.startSync(request).map(syncId => Map("sync_id" -> syncId))
      }
    }

  filter[ApiKeyFilter]
    .post("/ingestion/file/sync/end") { request: EndSyncRequest =>
      Profiler("[FileUpload]::end_sync") {
        syncInfoService.endSync(request.syncId).map(success => Map("success" -> success))
      }
    }

}
