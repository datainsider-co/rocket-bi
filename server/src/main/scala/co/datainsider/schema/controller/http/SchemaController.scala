package co.datainsider.schema.controller.http

import co.datainsider.bi.util.StringUtils
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.bi.util.tracker.{ActionType, ResourceType, UserActivityTracker}
import co.datainsider.caas.user_profile.controller.http.filter.{MustLoggedInFilter, PermissionFilter}
import co.datainsider.common.client.exception._
import co.datainsider.license.domain.LicensePermission
import co.datainsider.schema.domain.requests._
import co.datainsider.schema.domain.responses.{ListDatabaseResponse, ShortSchemaInfo}
import co.datainsider.schema.domain.{DatabaseSchema, TableSchema}
import co.datainsider.schema.service.{SchemaService, ShareService}
import com.google.inject.Inject
import com.google.inject.name.Named
import com.twitter.finagle.http.Request
import com.twitter.finatra.http.Controller
import com.twitter.util.Future

case class SchemaController @Inject() (
    schemaService: SchemaService,
    shareService: ShareService,
    permissionFilter: PermissionFilter,
    @Named("hidden_db_name_patterns") hiddenDbNamePatterns: Seq[String]
) extends Controller {

  filter(permissionFilter.requireAll("database:create:*", LicensePermission.EditData))
    .post("/databases") { request: CreateDBRequest =>
      Profiler(s"/databases POST")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Database,
        resourceId = request.name,
        description = s"create database ${request.name}"
      ) {
        schemaService.createDatabase(request).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.requireAll(LicensePermission.ViewData))
    .get("/databases") { request: ListDBRequest =>
      Profiler(s"/databases GET") {
        for {
          allDatabases <- schemaService.getDatabases(request.getOrganizationId())
          databases = allDatabases.filterNot(db => isHiddenDB(db.name))
          permittedDatabases <- schemaService.filterPermittedDatabases(
            request.getOrganizationId(),
            databases,
            request.currentUsername
          )
        } yield permittedDatabases
      }
    }

  private def isHiddenDB(dbName: String): Boolean = {
    hiddenDbNamePatterns.exists(regex => StringUtils.test(dbName, regex))
  }

  filter(permissionFilter.requireAll(LicensePermission.ViewData))
    .post("/databases/multi_gets") { request: MultiGetDatabaseRequest =>
      Profiler(s"/databases/multi_gets") {
        for {
          dbNames <- schemaService.getPermittedDatabase(
            request.getOrganizationId(),
            request.dbNames.filter(dbName => !isHiddenDB(dbName)),
            request.currentUsername
          )
          databaseSchemas <- schemaService.getDatabaseSchemas(request.getOrganizationId(), dbNames)
        } yield databaseSchemas.map(dbInfo => dbInfo.copy(database = updateDisplayNames(dbInfo.database)))
      }
    }

  filter(permissionFilter.requireAll("database:view:[db_name]", LicensePermission.ViewData))
    .get("/databases/:db_name") { request: GetDbRequest =>
      Profiler(s"/databases/:db_name GET") {
        schemaService
          .getDatabaseSchema(
            request.getOrganizationId(),
            request.dbName
          )
          .map(updateDisplayNames)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .put("/databases/:db_name") { request: PutDBRequest =>
      Profiler(s"/databases/:db_name PUT")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Database,
        resourceId = request.dbSchema.name,
        description = s"edit database ${request.dbSchema.name}"
      ) {
        schemaService.createDatabaseFromSchema(request.dbSchema).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.requireAll("database:delete:[db_name]", LicensePermission.EditData))
    .delete("/databases/:db_name") { request: DeleteDBRequest =>
      Profiler(s"/databases/:db_name DELETE")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Database,
        resourceId = request.dbName,
        description = s"delete database ${request.dbName}"
      ) {
        val orgId: Long = request.currentOrganizationId.get
        schemaService.deleteDatabase(orgId, request).flatMap {
          case true => Future.True
          case _    => Future.exception(InternalError("Failed to delete this database"))
        }
      }
    }

  filter(permissionFilter.requireAll("database:view:[db_name]", LicensePermission.ViewData))
    .get("/databases/:db_name/tables/:tbl_name") { request: GetTblRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name GET") {
        val orgId: Long = request.currentOrganizationId.get
        schemaService.getTableSchema(orgId, request.dbName, request.tblName).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .post("/databases/:db_name/tables") { request: CreateTableRequest =>
      Profiler(s"/databases/:db_name/tables POST")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Table,
        resourceId = request.dbName,
        description = s"create table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.createTableSchema(request).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .put("/databases/:db_name/tables/:tbl_name") { request: UpdateTableRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name PUT")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"update table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.updateTableSchema(request.currentOrganizationId.get, request.tableSchema).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .put("/databases/:db_name/tables/:tbl_name/name") { request: RenameTableRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/name PUT")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
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

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .delete("/databases/:db_name/tables/:tbl_name") { request: DeleteTableRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name DELETE")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"delete table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.deleteTableSchema(request.currentOrganizationId.get, request.dbName, request.tblName).flatMap {
          case true => Future.True
          case _    => Future.exception(InternalError("Failed to delete this table"))
        }
      }
    }

  filter(permissionFilter.requireAll("database:view:*", LicensePermission.ViewData))
    .post("/databases/detect") { request: DetectSchemaRequest =>
      Profiler(s"/databases/detect") {
        schemaService.detect(request)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .post("/databases/:db_name/tables/:tbl_name/column") { request: CreateColumnRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/column POST")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"add column ${request.column.name} to table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.createColumn(request).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.requireAll("database:view:[db_name]", LicensePermission.ViewData))
    .get("/databases/:db_name/tables/:tbl_name/expression") { request: Request =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/expression GET") {
        val dbName: String = request.getParam("db_name")
        val tblName: String = request.getParam("tbl_name")
        schemaService.getExpressions(dbName, tblName)
      }
    }

  filter(permissionFilter.requireAll("database:view:[db_name]", LicensePermission.ViewData))
    .post("/databases/:db_name/tables/:tbl_name/expression") { request: DetectExpressionTypeRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/expression POST") {
        schemaService.detectExpressionType(request)
      }
    }

  filter(permissionFilter.requireAll("database:view:[db_name]", LicensePermission.ViewData))
    .post("/databases/:db_name/tables/:tbl_name/aggregate_expression") { request: DetectExpressionTypeRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/aggregate_expression POST") {
        schemaService.detectAggregateExpression(request)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .put("/databases/:db_name/tables/:tbl_name/column") { request: UpdateColumnRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/column PUT")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"update column ${request.column.name} in table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.updateColumn(request).map(updateDisplayNames)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .delete("/databases/:db_name/tables/:tbl_name/columns/:column_name") { request: DeleteColumnRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/columns/:column_name DELETE")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"delete column ${request.columnName} in table ${request.dbName}.${request.tblName}"
      ) {
        schemaService.deleteCalculatedColumn(request)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .post("/databases/:db_name/tables/from_query") { request: CreateTableFromQueryRequest =>
      Profiler(s"/databases/:db_name/tables/from_query POST")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"create view ${request.dbName}.${request.tblName} from query"
      ) {
        schemaService.createTableSchema(request).map(updateDisplayNames)
      }
    }

  filter[MustLoggedInFilter].post("/databases/adhoc/tables") { request: DetectAdhocTableSchemaRequest =>
    Profiler(s"/databases/adhoc/tables") {
      schemaService.detectAdhocTableSchema(request)
    }
  }

  post("/databases/detect_columns") { request: DetectColumnsRequest =>
    Profiler(s"/databases/detect_columns") {
      schemaService.detectColumns(request.getOrganizationId(), request.query)
    }
  }

  get("/databases/trash") { request: ListDBRequest =>
    Profiler(s"/databases/trash") {
      schemaService.listDeletedDatabases(request.currentOrganizationId.get, request)
    }
  }

  get("/databases/my_data") { request: ListDBRequest =>
    Profiler(s"/databases/my_data") {
      schemaService
        .listDatabases(request.getOrganizationId(), request)
        .map((responseList: ListDatabaseResponse) => {
          val data: Seq[ShortSchemaInfo] = responseList.data.filterNot(db => isHiddenDB(db.database.name))
          responseList.copy(
            data = data,
            total = data.length
          )
        })
    }
  }

  filter(permissionFilter.requireAll("database:delete:[db_name]", LicensePermission.EditData))
    .put("/databases/:db_name/remove") { request: DeleteDBRequest =>
      Profiler("/databases/:db_name/remove")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Database,
        resourceId = request.dbName,
        description = s"move database ${request.dbName} to trash"
      ) {
        schemaService.removeDatabase(request).flatMap {
          case true => Future.True
          case _    => Future.exception(InternalError("Failed to remove this database"))
        }
      }
    }

  filter(permissionFilter.requireAll("database:delete:[db_name]", LicensePermission.EditData))
    .put("/databases/:db_name/restore") { request: DeleteDBRequest =>
      Profiler(s"/databases/:db_name/restore")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Database,
        resourceId = request.dbName,
        description = s"restore database ${request.dbName} from trash"
      ) {
        schemaService.restoreDatabase(request).flatMap {
          case true => Future.True
          case _    => Future.exception(InternalError("Failed to restore this database"))
        }
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .post("/databases/:db_name/tables/:tbl_name/expr_column") { request: CreateExprColumnRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/expr_column POST")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"create expression column ${request.column.name} to ${request.dbName}.${request.tblName}"
      ) {
        schemaService.createExprColumn(request)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .put("/databases/:db_name/tables/:tbl_name/expr_column") { request: UpdateExprColumnRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/expr_column PUT")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"update expression column ${request.column.name} in ${request.dbName}.${request.tblName}"
      ) {
        schemaService.updateExprColumn(request)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .delete("/databases/:db_name/tables/:tbl_name/expr_column/:column_name") { request: DeleteExprColumnRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/expr_column/:column_name DELETE")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"delete expression column ${request.columnName} in ${request.dbName}.${request.tblName}"
      ) {
        schemaService.deleteExprColumn(request)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .post("/databases/:db_name/tables/:tbl_name/calc_column") { request: CreateExprColumnRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/calc_column POST")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Create,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"create calculated column ${request.column.name} to ${request.dbName}.${request.tblName}"
      ) {
        schemaService.createCalcColumn(request)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .put("/databases/:db_name/tables/:tbl_name/calc_column") { request: UpdateExprColumnRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/calc_column PUT")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Update,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"update calculated column ${request.column.name} in ${request.dbName}.${request.tblName}"
      ) {
        schemaService.updateCalcColumn(request)
      }
    }

  filter(permissionFilter.requireAll("database:edit:[db_name]", LicensePermission.EditData))
    .delete("/databases/:db_name/tables/:tbl_name/calc_column/:column_name") { request: DeleteExprColumnRequest =>
      Profiler(s"/databases/:db_name/tables/:tbl_name/calc_column/:column_name DELETE")
      UserActivityTracker(
        request = request.request,
        actionName = request.getClass.getSimpleName,
        actionType = ActionType.Delete,
        resourceType = ResourceType.Table,
        resourceId = s"${request.dbName}.${request.tblName}",
        description = s"delete calculated column ${request.columnName} in ${request.dbName}.${request.tblName}"
      ) {
        schemaService.deleteCalcColumn(request)
      }
    }

  private def updateDisplayNames(databaseSchema: DatabaseSchema): DatabaseSchema = {
    databaseSchema.copy(displayName = databaseSchema.name, tables = databaseSchema.tables.map(updateDisplayNames))
  }

  private def updateDisplayNames(tableSchema: TableSchema): TableSchema = {
    tableSchema.copy(displayName = tableSchema.name)
  }
}
