package co.datainsider.schema.controller.http

import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.controller.http.filter.PermissionFilter
import co.datainsider.license.domain.LicensePermission
import co.datainsider.schema.controller.http.filter.ServiceKeyFilter
import co.datainsider.schema.domain._
import co.datainsider.schema.domain.requests._
import co.datainsider.schema.service._
import com.google.inject.Inject
import com.twitter.finatra.http.Controller

case class IngestionController @Inject() (
    ingestionService: IngestionService,
    csvIngestionService: CsvIngestionService,
    schemaService: SchemaService,
    oldCsvUploadService: OldCsvUploadService,
    permissionFilter: PermissionFilter
) extends Controller {

  filter[ServiceKeyFilter]
    .post("/ingestion/properties") { request: IngestRequest =>
      Profiler("/ingestion/properties") {
        ingestionService.ingest(request)
      }
    }

  filter[ServiceKeyFilter]
    .post("/ingestion/ensure_schema") { request: EnsureSparkSchemaRequest =>
      Profiler("/ingestion/ensure_schema") {
        ingestionService.ensureSchema(request)
      }
    }

  filter[ServiceKeyFilter]
    .delete("/ingestion/:db_name/:tbl_name") { request: ClearTableRequest =>
      Profiler("/ingestion/:db_name/:tbl_name DELETE") {
        ingestionService.clearTable(request)
      }
    }

  filter[ServiceKeyFilter]
    .post("/ingestion/csv/register") { request: OldCsvRegisterRequest =>
      Profiler("/ingestion/csv/register") {
        oldCsvUploadService.register(request)
      }
    }

  filter[ServiceKeyFilter]
    .post("/ingestion/csv/preview") { request: DetectCsvSchemaRequest =>
      Profiler("/ingestion/csv/preview") {
        oldCsvUploadService.preview(request)
      }
    }

  filter[ServiceKeyFilter]
    .post("/ingestion/csv/upload") { request: OldCsvUploadRequest =>
      Profiler("/ingestion/csv/upload") {
        oldCsvUploadService.uploadBatch(request)
      }
    }

  post("/ingestion/csv/schema") { request: RegisterCsvSchemaRequest =>
    Profiler("/ingestion/csv/schema") {
      csvIngestionService.registerSchema(request)
    }
  }

  post("/ingestion/csv/detect") { request: DetectCsvSchemaRequest =>
    Profiler("/ingestion/csv/detect") {
      csvIngestionService.detectSchema(request)
    }
  }

  filter(permissionFilter.requireAll("database:edit:*", LicensePermission.EditData))
    .post("/ingestion/csv") { request: IngestCsvRequest =>
      Profiler("/ingestion/csv") {
        csvIngestionService.ingestCsv(request)
      }
    }

  filter(permissionFilter.requireAll("database:edit:*", LicensePermission.EditData))
    .post("/ingestion/batch") { request: IngestBatchRequest =>
      Profiler("/ingestion/batch") {
        ingestionService.ingest(request.dbName, request.tblName, request.records)
      }
    }
}
