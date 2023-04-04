package datainsider.ingestion.controller.thrift

import com.twitter.finatra.thrift.Controller
import com.twitter.inject.Logging
import com.twitter.scrooge.{Request, Response}
import com.twitter.util.Future
import datainsider.analytics.service.TrackingSchemaService
import datainsider.analytics.service.tracking.ApiKeyService
import datainsider.client.util.JsonParser
import datainsider.data_cook.service.EtlJobService
import datainsider.ingestion.domain.TableSchema
import datainsider.ingestion.domain.thrift.{TEventDetailSchemaMapResult, TEventDetailSchemaResult}
import datainsider.ingestion.service.TSchemaService._
import datainsider.ingestion.service.{FileSyncInfoService, SchemaService, TSchemaService}
import datainsider.ingestion.util.ClickHouseUtils
import datainsider.ingestion.util.ThriftImplicits.{ScroogeResponseLike, ScroogeResponseStringLike}

import javax.inject.Inject

case class TSchemaController @Inject() (
    schemaService: SchemaService,
    apiKeyService: ApiKeyService,
    trackingSchemaService: TrackingSchemaService,
    fileSyncInfoService: FileSyncInfoService,
    etlService: EtlJobService
) extends Controller(TSchemaService)
    with Logging {

  handle(GetDatabases).withFn { request: Request[GetDatabases.Args] =>
    schemaService
      .getDatabases(request.args.organizationId)
      .map(_.asDatabaseShortInfo())
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(GetDatabaseSchema).withFn { request: Request[GetDatabaseSchema.Args] =>
    schemaService
      .getDatabaseSchema(request.args.organizationId, request.args.dbName)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(GetTableSchema).withFn { request: Request[GetTableSchema.Args] =>
    schemaService
      .getTableSchema(request.args.organizationId, request.args.dbName, request.args.tblName)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(GetAnalyticsDatabaseSchema).withFn { request: Request[GetAnalyticsDatabaseSchema.Args] =>
    trackingSchemaService
      .getTrackingDb(request.args.organizationId)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
  }

  handle(GetAnalyticsUserProfileSchema).withFn { request: Request[GetAnalyticsUserProfileSchema.Args] =>
    trackingSchemaService
      .getUserProfileSchema(request.args.organizationId)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(GetAnalyticsEventSchema).withFn { request: Request[GetAnalyticsEventSchema.Args] =>
    trackingSchemaService
      .getEventSchema(request.args.organizationId)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(GetAnalyticsEventDetailSchema).withFn { request: Request[GetAnalyticsEventDetailSchema.Args] =>
    trackingSchemaService
      .getEventDetailSchema(request.args.organizationId, request.args.event)
      .map {
        case Some(schema) => TEventDetailSchemaResult(0, Some(JsonParser.toJson(schema)))
        case _            => TEventDetailSchemaResult(0, None)
      }
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(MultiGetAnalyticsEventDetailSchema).withFn { request: Request[MultiGetAnalyticsEventDetailSchema.Args] =>
    trackingSchemaService
      .multiGetEventDetailSchema(request.args.organizationId, request.args.events)
      .map(dataMap => {
        val result = dataMap.map {
          case (event, schema) => event -> JsonParser.toJson(schema)
        }
        TEventDetailSchemaMapResult(0, Some(result))
      })
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(CreateOrMergeTableSchema).withFn { request: Request[CreateOrMergeTableSchema.Args] =>
    val tableSchema = JsonParser.fromJson[TableSchema](request.args.schema)
    schemaService
      .createOrMergeTableSchema(tableSchema)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(EnsureDatabaseCreated).withFn { request: Request[EnsureDatabaseCreated.Args] =>
    val orgId = request.args.organizationId
    val dbName = ClickHouseUtils.buildDatabaseName(orgId, request.args.name)
    val displayName = request.args.displayName
    schemaService.ensureDatabaseCreated(orgId, dbName, displayName).map(Response(_)).rescue {
      case e: Throwable => throw e
    }
  }

  handle(RenameTableSchema).withFn { request: Request[RenameTableSchema.Args] =>
    val orgId = request.args.organizationId
    val dbName = request.args.dbName
    val tblName = request.args.tblName
    val newTblName = request.args.newTblName
    schemaService.renameTableSchema(orgId, dbName, tblName, newTblName).map(Response(_)).rescue {
      case e: Throwable => throw e
    }
  }

  handle(DeleteTableSchema).withFn { request: Request[DeleteTableSchema.Args] =>
    val orgId = request.args.organizationId
    val dbName = request.args.dbName
    val tblName = request.args.tblName
    schemaService.deleteTableSchema(orgId, dbName, tblName).map(Response(_)).rescue {
      case e: Throwable => throw e
    }
  }

  handle(GetTemporaryTables).withFn { request: Request[GetTemporaryTables.Args] =>
    schemaService
      .getTemporaryTables(request.args.organizationId, request.args.dbName)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
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

  handle(MergeEventDetailSchema).withFn { request: Request[MergeEventDetailSchema.Args] =>
    val eventProperties = JsonParser.fromJson[Map[String, Any]](request.args.propertiesAsJson)
    trackingSchemaService
      .mergeEventDetailSchema(request.args.organizationId, request.args.event, eventProperties)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(GetApiKey).withFn { request: Request[GetApiKey.Args] =>
    val apiKey: String = request.args.apiKey
    apiKeyService
      .getApiKey(apiKey)
      .map(Response(_))
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(MergeSchemaByProperties).withFn { request: Request[MergeSchemaByProperties.Args] =>
    val properties = JsonParser.fromJson[Map[String, Any]](request.args.propertiesAsJson)
    schemaService
      .mergeSchemaByProperties(
        organizationId = request.args.organizationId,
        dbName = request.args.dbName,
        tblName = request.args.tblName,
        properties = properties
      )
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(GetExpressions).withFn { request: Request[GetExpressions.Args] =>
    schemaService
      .getExpressions(request.args.dbName, request.args.tblName)
      .map(JsonParser.toJson(_))
      .map(_.toScroogeResponse)
      .rescue {
        case e: Throwable => throw e
      }
  }

  handle(ExecLongRunningProcess).withFn { request: Request[ExecLongRunningProcess.Args] =>
    val seconds: Int = request.args.seconds
    schemaService.execLongRunningProcess(seconds).map(Response(_))
  }

  handle(IsDbExists).withFn { request: Request[IsDbExists.Args] =>
    val orgId: Long = request.args.organizationId
    val name: String = request.args.name
    schemaService.isDatabaseExists(orgId, name, false).map(Response(_))
  }

  handle(IsTblExists).withFn { request: Request[IsTblExists.Args] =>
    val orgId: Long = request.args.organizationId
    val dbName: String = request.args.dbName
    val tblName: String = request.args.tblName
    schemaService.isTableExists(orgId, dbName, tblName, false).map(Response(_))
  }

  handle(DeleteUserData).withFn { request: Request[DeleteUserData.Args] =>
    {
      val args: DeleteUserData.Args = request.args
      val result: Future[Boolean] = for {
        isDeletedCook <- etlService.deleteUserData(args.organizationId, args.username)
      } yield true

      result
        .rescue {
          case ex: Throwable =>
            logger.error(s"Failed to delete user data org ${args.organizationId}, username ${args.username} failed", ex)
            Future.False
        }
        .map(Response(_))
        .rescue {
          case e: Throwable => throw e
        }
    }
  }

  handle(Transfer).withFn { request: Request[Transfer.Args] =>
    {
      val args: Transfer.Args = request.args
      val result: Future[Boolean] = for {
        _ <- etlService.transfer(args.organizationId, args.fromUsername, args.toUsername)
      } yield true

      result
        .rescue {
          case ex: Throwable =>
            logger.error(
              s"Failed to transfer data org ${args.organizationId} from ${args.fromUsername} to ${args.toUsername} failed",
              ex
            )
            Future.False
        }
        .map(Response(_))
        .rescue {
          case e: Throwable => throw e
        }
    }
  }
}
