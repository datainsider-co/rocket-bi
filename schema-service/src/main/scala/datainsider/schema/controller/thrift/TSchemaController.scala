package datainsider.schema.controller.thrift

import com.twitter.finatra.thrift.Controller
import com.twitter.inject.Logging
import com.twitter.scrooge.{Request, Response}
import datainsider.client.util.JsonParser
import datainsider.schema.domain.TableSchema
import datainsider.schema.service.TSchemaService.{GetExpressions, _}
import datainsider.schema.service.{FileSyncInfoService, SchemaService, TSchemaService}
import datainsider.schema.util.ClickHouseUtils
import datainsider.schema.util.ThriftImplicits.ScroogeResponseStringLike

import javax.inject.Inject

case class TSchemaController @Inject() (
    schemaService: SchemaService,
    fileSyncInfoService: FileSyncInfoService
) extends Controller(TSchemaService)
    with Logging {

  handle(GetDatabases).withFn { request: Request[GetDatabases.Args] =>
    schemaService
      .getDatabases(request.args.organizationId)
      .map(_.asDatabaseShortInfo())
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
  }

  handle(GetDatabaseSchema).withFn { request: Request[GetDatabaseSchema.Args] =>
    schemaService
      .getDatabaseSchema(request.args.organizationId, request.args.dbName)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
  }

  handle(GetTableSchema).withFn { request: Request[GetTableSchema.Args] =>
    schemaService
      .getTableSchema(request.args.organizationId, request.args.dbName, request.args.tblName)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
  }

  handle(CreateOrMergeTableSchema).withFn { request: Request[CreateOrMergeTableSchema.Args] =>
    val tableSchema = JsonParser.fromJson[TableSchema](request.args.schema)
    schemaService.createOrMergeTableSchema(tableSchema).map(Response(_))
  }

  handle(EnsureDatabaseCreated).withFn { request: Request[EnsureDatabaseCreated.Args] =>
    val orgId = request.args.organizationId
    val dbName = ClickHouseUtils.buildDatabaseName(orgId, request.args.name)
    val displayName = request.args.displayName
    schemaService.ensureDatabaseCreated(orgId, dbName, displayName).map(Response(_))
  }

  handle(RenameTableSchema).withFn { request: Request[RenameTableSchema.Args] =>
    val orgId = request.args.organizationId
    val dbName = request.args.dbName
    val tblName = request.args.tblName
    val newTblName = request.args.newTblName
    schemaService.renameTableSchema(orgId, dbName, tblName, newTblName).map(Response(_))
  }

  handle(DeleteTableSchema).withFn { request: Request[DeleteTableSchema.Args] =>
    val orgId = request.args.organizationId
    val dbName = request.args.dbName
    val tblName = request.args.tblName
    schemaService.deleteTableSchema(orgId, dbName, tblName).map(Response(_))
  }

  handle(GetTemporaryTables).withFn { request: Request[GetTemporaryTables.Args] =>
    schemaService
      .getTemporaryTables(request.args.organizationId, request.args.dbName)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
  }

  handle(Verify).withFn { request: Request[Verify.Args] =>
    fileSyncInfoService
      .verify(request.args.syncId, request.args.fileName)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
  }

  handle(RecordHistory).withFn { request: Request[RecordHistory.Args] =>
    fileSyncInfoService
      .recordHistory(
        request.args.historyId,
        request.args.fileName,
        request.args.fileSize,
        request.args.isSuccess,
        request.args.message
      )
      .map(Response(_))
  }

  handle(MergeSchemaByProperties).withFn { request: Request[MergeSchemaByProperties.Args] =>
    val properties = JsonParser.fromJson[Map[String, Any]](request.args.propertiesAsJson)
    schemaService
      .mergeSchemaByProperties(request.args.organizationId, request.args.dbName, request.args.tblName, properties)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
  }

  handle(GetExpressions).withFn { request: Request[GetExpressions.Args] =>
    schemaService
      .getExpressions(request.args.dbName, request.args.tblName)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
  }
}
