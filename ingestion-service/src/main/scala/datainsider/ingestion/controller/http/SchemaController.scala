package datainsider.ingestion.controller.http

import com.google.inject.Inject
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.util.Future
import datainsider.client.exception._
import datainsider.client.filter.{MustLoggedInFilter, PermissionFilter}
import datainsider.ingestion.controller.http.requests._
import datainsider.ingestion.domain.{DatabaseSchema, TableSchema}
import datainsider.ingestion.service.{IngestionService, SchemaService, ShareService}
import datainsider.profiler.Profiler
import datainsider.tracker.{ActionType, ResourceType, UserActivityTracker}

import scala.concurrent.ExecutionContext.Implicits.global

case class SchemaController @Inject() (
    schemaService: SchemaService,
    ingestionService: IngestionService,
    shareService: ShareService,
    permissionFilter: PermissionFilter
) extends Controller {

  filter(permissionFilter.require("database:create:*"))
    .post("/databases") { request: CreateDBRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::CreateDBRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Database,
        description = s"create database ${request.name}"
      ) {
        schemaService.createDatabase(request).map(updateDisplayNames)
      }
    }

  get("/databases") { request: ListDBRequest =>
    Profiler(s"[Schema] ${this.getClass.getSimpleName}::/databases") {
      for {
        databases <- schemaService.getDatabases(request.currentOrganizationId.get)
        permittedDatabase <- schemaService.filterPermittedDatabases(
          request.currentOrganizationId.get,
          databases,
          request.currentUsername
        )
      } yield permittedDatabase.map(updateDisplayNames).asDatabaseShortInfo()
    }
  }

  post("/databases/multi_gets") { request: MultiGetDatabaseRequest =>
    Profiler(s"[Schema] ${this.getClass.getSimpleName}::MultiGetDatabaseRequest") {
      for {
        dbNames <- schemaService.getPermittedDatabase(
          request.currentOrganizationId.get,
          request.dbNames,
          request.currentUsername
        )
        databaseSchemas <- schemaService.getDatabaseSchemas(request.currentOrganizationId.get, dbNames)
      } yield databaseSchemas.map(dbInfo => dbInfo.copy(database = updateDisplayNames(dbInfo.database)))
    }
  }

  filter(permissionFilter.require("database:view:[db_name]"))
    .get("/databases/:db_name") { request: GetDbRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::GetDbRequest") {
        schemaService
          .getDatabaseSchema(
            request.currentOrganizationId.get,
            request.dbName
          )
          .map(updateDisplayNames)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .put("/databases/:db_name") { request: PutDBRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::PutDBRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Database,
        description = s"edit database ${request.dbSchema.name}"
      ) {
        schemaService.addDatabase(request.dbSchema).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.require("database:delete:[db_name]"))
    .delete("/databases/:db_name") { request: DeleteDBRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::DeleteDBRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Database,
        description = s"delete database ${request.dbName}"
      ) {
        val orgId: Long = request.currentOrganizationId.get
        schemaService.deleteDatabase(orgId, request).flatMap {
          case true => Future.True
          case _    => Future.exception(datainsider.client.exception.InternalError("Failed to delete this database"))
        }
      }
    }

  filter(permissionFilter.require("database:view:[db_name]"))
    .get("/databases/:db_name/tables/:tbl_name") { request: GetTblRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::GetTblRequest") {
        val orgId: Long = request.currentOrganizationId.get
        schemaService.getTableSchema(orgId, request.dbName, request.tblName).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .post("/databases/:db_name/tables") { request: CreateTableRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::CreateTableRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Table,
        description = s"create table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.createTableSchema(request).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .put("/databases/:db_name/tables/:tbl_name") { request: UpdateTableRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::UpdateTableRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        description = s"update table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.updateTableSchema(request.currentOrganizationId.get, request.tableSchema).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .put("/databases/:db_name/tables/:tbl_name/name") { request: RenameTableRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::RenameTableRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        description = s"rename table ${request.dbName}.${request.tblName} to `${request.newName}`"
      ) {
        schemaService.renameTableSchema(
          request.currentOrganizationId.get,
          request.dbName,
          request.tblName,
          request.getNormalizedName
        )
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .delete("/databases/:db_name/tables/:tbl_name") { request: DeleteTableRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::DeleteTableRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Table,
        description = s"delete table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.deleteTableSchema(request.currentOrganizationId.get, request.dbName, request.tblName).flatMap {
          case true => Future.True
          case _    => Future.exception(InternalError("Failed to delete this table"))
        }
      }
    }

  filter(permissionFilter.require("database:view:*"))
    .post("/databases/detect") { request: DetectSchemaRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::DetectSchemaRequest") {
        schemaService.detect(request)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .post("/databases/:db_name/tables/:tbl_name/column") { request: CreateColumnRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::CreateColumnRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        description = s"add column ${request.column.name} to table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.createColumn(request).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.require("database:view:[db_name]"))
    .get("/databases/:db_name/tables/:tbl_name/expression") { request: Request =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::GetExpressions") {
        val dbName: String = request.getParam("db_name")
        val tblName: String = request.getParam("tbl_name")
        schemaService.getExpressions(dbName, tblName)
      }
    }

  filter(permissionFilter.require("database:view:[db_name]"))
    .post("/databases/:db_name/tables/:tbl_name/expression") { request: DetectExpressionTypeRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::DetectExpressionTypeRequest") {
        schemaService.detectExpressionType(request)
      }
    }

  filter(permissionFilter.require("database:view:[db_name]"))
    .post("/databases/:db_name/tables/:tbl_name/aggregate_expression") { request: DetectExpressionTypeRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::DetectExpressionTypeRequest") {
        schemaService.detectAggregateExpression(request)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .put("/databases/:db_name/tables/:tbl_name/column") { request: UpdateColumnRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::UpdateColumnRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        description = s"update column ${request.column.name} in table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.updateColumn(request).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .delete("/databases/:db_name/tables/:tbl_name/columns/:column_name") { request: DeleteColumnRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::DeleteColumnRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Table,
        description = s"delete column ${request.columnName} in table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.deleteCalculatedColumn(request)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .post("/databases/:db_name/tables/from_query") { request: CreateTableFromQueryRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::CreateTableFromQueryRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Table,
        description = s"create view ${request.dbName}.${request.tblName} from query"
      ) {
        schemaService.createTableSchema(request).map(updateDisplayNames)
      }
    }

  filter[MustLoggedInFilter].post("/databases/adhoc/tables") { request: DetectAdhocTableSchemaRequest =>
    Profiler(s"[Schema] ${this.getClass.getSimpleName}::DetectAdhocTableSchemaRequest") {
      schemaService.detectAdhocTableSchema(request)
    }
  }

  post("/databases/detect_columns") { request: DetectColumnsRequest =>
    Profiler(s"[Schema] ${this.getClass.getSimpleName}::DetectColumnsRequest") {
      schemaService.detectColumns(request.query)
    }
  }

  get("/databases/trash") { request: ListDBRequest =>
    Profiler(s"[Schema] ${this.getClass.getSimpleName}::/databases/trash") {
      schemaService.listDeletedDatabases(request.currentOrganizationId.get, request)
    }
  }

  get("/databases/my_data") { request: ListDBRequest =>
    Profiler(s"[Schema] ${this.getClass.getSimpleName}::/databases/my_data") {
      schemaService.listDatabases(request.currentOrganizationId.get, request)
    }
  }

  filter(permissionFilter.require("database:delete:[db_name]"))
    .put("/databases/:db_name/remove") { request: DeleteDBRequest =>
      Profiler(
        s"[Schema] ${this.getClass.getSimpleName}::/databases/:db_name/remove"
      )
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Database,
        description = s"move database ${request.dbName} to trash"
      ) {
        schemaService.removeDatabase(request).flatMap {
          case true => Future.True
          case _    => Future.exception(datainsider.client.exception.InternalError("Failed to remove this database"))
        }
      }
    }

  filter(permissionFilter.require("database:delete:[db_name]"))
    .put("/databases/:db_name/restore") { request: DeleteDBRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::/databases/:db_name/restore")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Database,
        description = s"restore database ${request.dbName} from trash"
      ) {
        schemaService.restoreDatabase(request).flatMap {
          case true => Future.True
          case _    => Future.exception(datainsider.client.exception.InternalError("Failed to restore this database"))
        }
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .post("/databases/:db_name/tables/:tbl_name/expr_column") { request: CreateExprColumnRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::CreateExprColumnRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Table,
        description = s"create expression column ${request.column.name} to ${request.dbName}.${request.tblName}"
      ) {
        schemaService.createExprColumn(request)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .put("/databases/:db_name/tables/:tbl_name/expr_column") { request: UpdateExprColumnRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::UpdateExprColumnRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        description = s"update expression column ${request.column.name} in ${request.dbName}.${request.tblName}"
      ) {
        schemaService.updateExprColumn(request)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .delete("/databases/:db_name/tables/:tbl_name/expr_column/:column_name") { request: DeleteExprColumnRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::DeleteExprColumnRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Table,
        description = s"delete expression column ${request.columnName} in ${request.dbName}.${request.tblName}"
      ) {
        schemaService.deleteExprColumn(request)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .post("/databases/:db_name/tables/:tbl_name/calc_column") { request: CreateExprColumnRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::CreateCalcColumnRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Table,
        description = s"create calculated column ${request.column.name} to ${request.dbName}.${request.tblName}"
      ) {
        schemaService.createCalcColumn(request)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .put("/databases/:db_name/tables/:tbl_name/calc_column") { request: UpdateExprColumnRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::UpdateCalcColumnRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        description = s"update calculated column ${request.column.name} in ${request.dbName}.${request.tblName}"
      ) {
        schemaService.updateCalcColumn(request)
      }
    }

  filter(permissionFilter.require("database:edit:[db_name]"))
    .delete("/databases/:db_name/tables/:tbl_name/calc_column/:column_name") { request: DeleteExprColumnRequest =>
      Profiler(s"[Schema] ${this.getClass.getSimpleName}::DeleteCalcColumnRequest")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Table,
        description = s"delete calculated column ${request.columnName} in ${request.dbName}.${request.tblName}"
      ) {
        schemaService.deleteCalcColumn(request)
      }
    }

  get("/databases/_profiler") { _: Request =>
    {
      response.ok(Profiler.report())
    }
  }

  get("/databases/_profiler_html") { request: Request =>
    {
      response.ok.html(Profiler.reportAsHtml())
    }
  }

  private def updateDisplayNames(databaseSchema: DatabaseSchema): DatabaseSchema = {
    databaseSchema.copy(displayName = databaseSchema.name, tables = databaseSchema.tables.map(updateDisplayNames))
  }

  private def updateDisplayNames(tableSchema: TableSchema): TableSchema = {
    tableSchema.copy(displayName = tableSchema.name)
  }
}
