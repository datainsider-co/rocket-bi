package datainsider.schema.service

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.authorization.domain.PermissionProviders
import datainsider.client.domain.user.UserProfile
import datainsider.client.exception._
import datainsider.client.service.{OrgAuthorizationClientService, ProfileClientService}
import datainsider.profiler.Profiler
import datainsider.schema.controller.http.requests._
import datainsider.schema.controller.http.responses.{FullSchemaInfo, ListDatabaseResponse, ShortSchemaInfo, TableExpressionsResponse}
import datainsider.schema.domain.Types.DBName
import datainsider.schema.domain._
import datainsider.schema.domain.column._
import datainsider.schema.domain.column.Column
import datainsider.schema.misc.ColumnDetector
import datainsider.schema.repository.SchemaRepository
import datainsider.schema.util.Implicits.ImplicitString
import datainsider.schema.util.{ClickHouseUtils, SqlRegex, TableExpressionUtils}

import javax.inject.Inject
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author andy
  * @since 7/9/20
  */
trait SchemaService {
  def isDatabaseExists(organizationId: Long, dbName: String): Future[Boolean]

  def ensureDatabaseCreated(
      organizationId: Long,
      name: String,
      displayName: Option[String] = None,
      creatorId: Option[String] = None,
      force: Boolean = false
  ): Future[Unit]

  def createDatabase(request: CreateDBRequest): Future[DatabaseSchema]

  def addDatabase(dbSchema: DatabaseSchema): Future[DatabaseSchema]

  def updateTableSchema(organizationId: Long, schema: TableSchema): Future[TableSchema]

  def deleteDatabase(organizationId: Long, request: DeleteDBRequest): Future[Boolean]

  def deleteDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def filterPermittedDatabases(
      organizationId: Long,
      databases: Seq[DatabaseSchema],
      userName: String
  ): Future[Seq[DatabaseSchema]]

  /**
    * filter permitted database
    */
  def getPermittedDatabase(organizationId: Long, dbNames: Seq[String], username: String): Future[Seq[String]]

  def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]]

  @throws[DbNotFoundError]
  def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema]

  def getDatabaseSchemas(organizationId: Long, dbNames: Seq[DBName]): Future[Seq[FullSchemaInfo]]

  def isTableExists(organizationId: Long, dbName: String, tblName: String): Future[Boolean]

  def createOrMergeTableSchema(schema: TableSchema): Future[Unit]

  def mergeSchemaByProperties(
      organizationId: Long,
      dbName: String,
      tblName: String,
      properties: Map[String, Any]
  ): Future[TableSchema]

  def createTableSchemaIfNotExists(table: TableSchema): Future[TableSchema]

  /**
    * Create table from schema, if schema existed throw exception
    */
  def createTableSchema(table: TableSchema): Future[TableSchema]

  def createTableSchema(request: CreateTableRequest): Future[TableSchema]

  def createTableSchema(request: CreateTableFromQueryRequest): Future[TableSchema]

  def createTableSchema(organizationId: Long, tableFromQueryInfo: TableFromQueryInfo): Future[TableSchema]

  def detectAdhocTableSchema(request: DetectAdhocTableSchemaRequest): Future[TableSchema]

  @throws[DbNotFoundError]
  @throws[TableNotFoundError]
  def getTableSchema(organizationId: Long, dbName: String, tblName: String): Future[TableSchema]

  @throws[DbNotFoundError]
  @throws[TableNotFoundError]
  def getTableSchema(dbName: String, tblName: String): Future[TableSchema]

  def deleteTableSchema(request: DeleteTableRequest): Future[Boolean]

  def renameTableSchema(organizationId: Long, dbName: String, tblName: String, newTblName: String): Future[Boolean]

  def deleteTableSchema(organizationId: Long, dbName: String, tblName: String): Future[Boolean]

  def detect(request: DetectSchemaRequest): Future[Seq[Column]]

  def createColumn(request: CreateColumnRequest): Future[TableSchema]

  def updateColumn(request: UpdateColumnRequest): Future[TableSchema]

  def deleteCalculatedColumn(request: DeleteColumnRequest): Future[Boolean]

  def detectExpressionType(request: DetectExpressionTypeRequest): Future[String]

  def detectAggregateExpression(request: DetectExpressionTypeRequest): Future[String]

  def detectColumns(query: String): Future[Array[Column]]

  def getTemporaryTables(organizationId: Long, dbName: String): Future[DatabaseSchema]

  def listDatabases(organizationId: Long, request: ListDBRequest): Future[ListDatabaseResponse]

  def listDeletedDatabases(organizationId: Long, request: ListDBRequest): Future[ListDatabaseResponse]

  def removeDatabase(request: DeleteDBRequest): Future[Boolean]

  def restoreDatabase(request: DeleteDBRequest): Future[Boolean]

  def optimizeTable(
      organizationId: Long,
      dbName: String,
      tblName: String,
      primaryKeys: Array[String],
      isUseFinal: Boolean
  ): Future[Boolean]

  def createExprColumn(request: CreateExprColumnRequest): Future[TableSchema]

  def updateExprColumn(request: UpdateExprColumnRequest): Future[TableSchema]

  def deleteExprColumn(request: DeleteExprColumnRequest): Future[Boolean]

  def getExpressions(dbName: String, tblName: String): Future[TableExpressionsResponse]

  def createCalcColumn(request: CreateExprColumnRequest): Future[TableSchema]

  def updateCalcColumn(request: UpdateExprColumnRequest): Future[TableSchema]

  def deleteCalcColumn(request: DeleteExprColumnRequest): Future[Boolean]

}

case class SchemaServiceImpl @Inject() (
    schemaRepository: SchemaRepository,
    createDbValidator: Validator[CreateDBRequest],
    orgAuthorizationClientService: OrgAuthorizationClientService,
    profileService: ProfileClientService
) extends SchemaService
    with Logging {

  override def createOrMergeTableSchema(schema: TableSchema): Future[Unit] = {
    for {
      isExists <- schemaRepository.isTableExists(schema.organizationId, schema.dbName, schema.name)
      _ <-
        if (isExists) {
          schemaRepository.mergeColumns(
            schema.organizationId,
            schema.dbName,
            schema.name,
            schema.columns
          )
        } else {
          schemaRepository.createTable(schema.organizationId, schema)
        }
    } yield {}
  }

  override def createTableSchemaIfNotExists(tableSchema: TableSchema): Future[TableSchema] = {
    schemaRepository.isTableExists(tableSchema.organizationId, tableSchema.dbName, tableSchema.name, true).flatMap {
      case false => schemaRepository.createTable(tableSchema.organizationId, tableSchema)
      case _     => Future.value(tableSchema)
    }
  }

  override def createTableSchema(tableSchema: TableSchema): Future[TableSchema] = {
    schemaRepository.createTable(tableSchema.organizationId, tableSchema)
  }

  def isDatabaseExists(organizationId: Long, dbName: String): Future[Boolean] = {
    schemaRepository.isDatabaseExists(organizationId, dbName)
  }

  override def createDatabase(request: CreateDBRequest): Future[DatabaseSchema] = {
    for {
      _ <- createDbValidator.validate(request)
      dbSchema <- schemaRepository.createDatabase(request.buildDatabaseSchema())
      _ <- orgAuthorizationClientService.addPermissions(
        organizationId = request.currentOrganizationId.get,
        username = request.currentUsername,
        Seq(
          PermissionProviders.database
            .withOrganizationId(request.currentOrganizationId.get)
            .withDbName(dbSchema.name)
            .all()
        )
      )
    } yield dbSchema
  }

  override def addDatabase(dbSchema: DatabaseSchema): Future[DatabaseSchema] = {
    schemaRepository.createDatabase(dbSchema)
  }

  override def deleteDatabase(organizationId: Long, request: DeleteDBRequest): Future[Boolean] = {
    schemaRepository.dropDatabase(
      organizationId,
      request.dbName
    )
  }

  override def deleteDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    schemaRepository.dropDatabase(organizationId, dbName)
  }

  override def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]] = {
    println("\n\n\n\n\ngetDatabases\n\n\n\n\n")
    schemaRepository.getDatabases(organizationId)
  }

  override def getDatabaseSchemas(organizationId: Long, dbNames: Seq[DBName]): Future[Seq[FullSchemaInfo]] = {
    for {
      databases <- schemaRepository.getDatabaseSchemas(organizationId, dbNames).map(_.map(_.removeTemporaryTable()))
      response <- toFullSchemaInfo(organizationId, databases)
    } yield response
  }

  private def toFullSchemaInfo(organizationId: Long, databases: Seq[DatabaseSchema]): Future[Seq[FullSchemaInfo]] = {
    val creatorIds: Seq[String] = databases.map(_.creatorId)
    profileService
      .getUserProfiles(organizationId, creatorIds)
      .map(userProfiles => {
        databases.map(database => FullSchemaInfo(database, userProfiles.get(database.creatorId)))
      })
  }

  override def getTemporaryTables(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    schemaRepository
      .getDatabaseSchema(organizationId, dbName)
      .map(db => db.copy(tables = db.tables.filter(_.isTemporary)))
  }

  override def createTableSchema(request: CreateTableRequest): Future[TableSchema] = {
    schemaRepository.isTableExists(request.currentOrganizationId.get, request.dbName, request.tblName).flatMap {
      case false => schemaRepository.createTable(request)
      case true  => throw BadRequestError(s"table ${request.tblName} already exist in db ${request.dbName}")
    }
  }

  override def isTableExists(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = {
    getDatabaseSchema(organizationId, dbName)
      .map(_.findTableAsOption(tblName))
      .map(_.isDefined)
      .rescue {
        case ex: Throwable => Future.False
      }
  }

  override def deleteTableSchema(request: DeleteTableRequest): Future[Boolean] = {
    schemaRepository.dropTable(request.currentOrganizationId.get, request.dbName, request.tblName)
  }

  override def detect(request: DetectSchemaRequest): Future[Seq[Column]] = {
    val columns = ColumnDetector.detectColumns(request.getPropertiesAsMap())
    Future.value(columns)
  }

  override def createColumn(request: CreateColumnRequest): Future[TableSchema] = {
    def ensureColumnNotExists(request: CreateColumnRequest) = {
      isColumnExists(request.organizationId, request.dbName, request.tblName, request.column.name).map {
        case true => throw AlreadyExistError(s"This column is existed already: ${request.column.name}")
        case _    => true
      }
    }
    for {
      _ <- ensureColumnNotExists(request)
      _ <-
        schemaRepository
          .mergeColumns(
            request.organizationId,
            request.dbName,
            request.tblName,
            Seq(request.column)
          )
          .map {
            case true  => true
            case false => throw InternalError(s"Can't create this column.")
          }
      tableSchema <- getTableSchema(request.organizationId, request.dbName, request.tblName)
    } yield tableSchema
  }

  private def isColumnExists(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] = {
    schemaRepository.getTable(organizationId, dbName, tblName).map { tableSchema =>
      tableSchema.columns.exists(_.name.equals(columnName))
    }
  }

  override def updateColumn(request: UpdateColumnRequest): Future[TableSchema] = {
    def checkColumnExists(request: UpdateColumnRequest) = {
      isColumnExists(request.organizationId, request.dbName, request.tblName, request.column.name).map {
        case true => true
        case _    => throw AlreadyExistError(s"This column is not existed already: ${request.column.name}")
      }
    }
    for {
      _ <- checkColumnExists(request)
      _ <-
        schemaRepository
          .updateColumn(
            request.organizationId,
            request.dbName,
            request.tblName,
            request.column
          )
          .map {
            case true  => true
            case false => throw InternalError(s"Can't update this column.")
          }
      tableSchema <- getTableSchema(request.organizationId, request.dbName, request.tblName)
    } yield tableSchema
  }

  override def detectExpressionType(request: DetectExpressionTypeRequest): Future[String] = {
    for {
      expressionsResp <- getExpressions(request.dbName, request.tblName)
      resultDataType <- schemaRepository.detectExpressionType(
        request.dbName,
        request.tblName,
        request.expression,
        expressionsResp.expressions
      )
    } yield resultDataType
  }

  override def detectAggregateExpression(request: DetectExpressionTypeRequest): Future[String] = {
    for {
      expressionsResp <- getExpressions(request.dbName, request.tblName)
      resultDataType <- schemaRepository.detectAggregateExpressionType(
        request.dbName,
        request.tblName,
        request.expression,
        expressionsResp.expressions
      )
    } yield resultDataType
  }

  override def deleteCalculatedColumn(request: DeleteColumnRequest): Future[Boolean] = {
    for {
      isDropOk <- isCalculatedColumn(request).flatMap {
        case true  => schemaRepository.dropColumn(request)
        case false => throw InternalError("This column is not materialize")
      }
    } yield isDropOk
  }

  private def isCalculatedColumn(request: DeleteColumnRequest): Future[Boolean] = {
    schemaRepository.getTable(request.organizationId, request.dbName, request.tblName).map { tableSchema =>
      tableSchema.findColumn(request.columnName).exists(_.isMaterialized())
    }
  }

  override def createTableSchema(request: CreateTableFromQueryRequest): Future[TableSchema] = {
    val orgId = request.currentOrganizationId.get
    for {
      existingExpressions <- getExpressions(TableExpressionUtils.findDbTblNames(request.query))
      newTblSchema <- getTableSchemaFromQuery(request.organizationId, request.toTableFromQueryInfo, existingExpressions)
      createdTblSchema <- schemaRepository.isTableExists(orgId, request.dbName, request.tblName).flatMap {
        case false => schemaRepository.createTable(orgId, newTblSchema)
        case true =>
          if (request.isOverride) {
            schemaRepository.overrideTblSchema(orgId, newTblSchema)
          } else {
            throw BadRequestError(s"table ${request.tblName} already exist in db ${request.dbName}")
          }
      }
    } yield createdTblSchema
  }

  override def createTableSchema(
      organizationId: Long,
      tableFromQueryInfo: TableFromQueryInfo
  ): Future[TableSchema] =
    Profiler("[SchemaService]::createTableSchema") {
      for {
        existingExpressions <- getExpressions(TableExpressionUtils.findDbTblNames(tableFromQueryInfo.query))
        tableSchema <- getTableSchemaFromQuery(organizationId, tableFromQueryInfo, existingExpressions)
        newTableSchema <- schemaRepository.createTable(organizationId, tableSchema)
      } yield newTableSchema
    }

  override def detectAdhocTableSchema(request: DetectAdhocTableSchemaRequest): Future[TableSchema] = {
    for {
      existingExpressions <- getExpressions(TableExpressionUtils.findDbTblNames(request.query))
      tableSchema <- getTableSchemaFromQuery(
        request.orgId,
        request.toTableFromQueryInfo,
        existingExpressions
      )
    } yield tableSchema.copy(query = Some(request.query))
  }

  private def getTableSchemaFromQuery(
      organizationId: Long,
      tableFromQueryInfo: TableFromQueryInfo,
      existingExpressions: Map[String, String]
  ): Future[TableSchema] =
    Profiler("[SchemaService]::getTableSchemaFromQuery") {
      // TODO: check database name when merge
      val finalQuery: String = TableExpressionUtils.parseFullExpr(tableFromQueryInfo.query, existingExpressions)
      detectColumns(finalQuery).map(columns => {
        info(s"getTableSchemaFromQuery:: ${tableFromQueryInfo.query}")
//        val enhancedQuery: String = enhanceCreateViewQuery(columns, tableFromQueryInfo.query) // temporary remove enhance schema to preserve user's input sql
        tableFromQueryInfo.toTableSchema(organizationId, columns).copy(query = Some(finalQuery))
      })
    }

  override def detectColumns(query: String): Future[Array[Column]] = {
    info(s"detectColumns:: ${query}")
    schemaRepository.detectColumns(query)
  }

  private def getExpressions(dbTblNameTuples: Seq[(String, String)]): Future[Map[String, String]] = {
    Future
      .collect(dbTblNameTuples.map(dbTblName => getExpressions(dbTblName._1, dbTblName._2)))
      .map(responses => {
        responses.flatMap(_.expressions).toMap
      })
      .rescue {
        case e: Throwable =>
          error(s"${this.getClass.getSimpleName}::getExpressions for dbName.tblName failed with message: $e")
          Future(Map.empty)
      }
  }

  override def renameTableSchema(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean] = {
    for {
      isTblExists <- schemaRepository.isTableExists(organizationId, dbName, newTblName)
      renamedSucceeded <-
        if (!isTblExists) schemaRepository.renameTable(organizationId, dbName, tblName, newTblName)
        else throw BadRequestError(s"table ${newTblName} already exist in db $dbName")
    } yield renamedSucceeded
  }

  override def deleteTableSchema(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = {
    schemaRepository.dropTable(organizationId, dbName, tblName)
  }

  override def listDatabases(organizationId: Long, request: ListDBRequest): Future[ListDatabaseResponse] = {
    for {
      databases <- schemaRepository.getDatabases(organizationId)
      permittedDatabases <- filterPermittedDatabases(organizationId, databases, request.currentUsername)
      schemaInfo <- toShortSchemaInfo(organizationId, permittedDatabases)
    } yield ListDatabaseResponse(schemaInfo, schemaInfo.size)
  }

  override def filterPermittedDatabases(
      organizationId: Long,
      databaseSchemas: Seq[DatabaseSchema],
      username: String
  ): Future[Seq[DatabaseSchema]] = {
    for {
      databaseSet <- getPermittedDatabase(organizationId, databaseSchemas.map(_.name), username).map(_.toSet)
    } yield {
      databaseSchemas.filter(databaseSchema => databaseSet.contains(databaseSchema.name))
    }
  }

  /**
    * filter permitted database
    */
  override def getPermittedDatabase(
      organizationId: Long,
      dbNames: Seq[DBName],
      username: String
  ): Future[Seq[String]] = {
    val dbNameWithPermissionAsMap: Map[String, DBName] = dbNames
      .map(dbName =>
        PermissionProviders.database.withOrganizationId(organizationId).withDbName(dbName).view() -> dbName
      )
      .toMap
    val permissions: Array[String] = dbNameWithPermissionAsMap.keys.toArray
    for {
      permittedResults <- orgAuthorizationClientService.isPermitted(organizationId, username, permissions: _*)
    } yield {
      permittedResults
        .filter(result => result._2) // get permitted is true
        .keys
        .map(permission => dbNameWithPermissionAsMap.get(permission)) // map to dbname
        .filter(_.isDefined) // get item defined
        .map(_.get) // get database name
        .toSeq
    }
  }

  private def toShortSchemaInfo(organizationId: Long, databases: Seq[DatabaseSchema]): Future[Seq[ShortSchemaInfo]] = {
    val creatorIds: Seq[String] = databases.map(_.creatorId)
    profileService
      .getUserProfiles(organizationId, creatorIds)
      .map(userProfiles => {
        databases.map(database => ShortSchemaInfo(database.toDatabaseInfo(), userProfiles.get(database.creatorId)))
      })
  }

  override def listDeletedDatabases(organizationId: Long, request: ListDBRequest): Future[ListDatabaseResponse] = {
    for {
      databases <- schemaRepository.listDeletedDatabases(organizationId)
      permittedDatabases <- filterPermittedDatabases(organizationId, databases, request.currentUsername)
      schemaInfo <- toShortSchemaInfo(organizationId, permittedDatabases)
    } yield ListDatabaseResponse(schemaInfo, schemaInfo.size)
  }

  override def removeDatabase(request: DeleteDBRequest): Future[Boolean] = {
    schemaRepository.removeDatabase(request.currentOrganizationId.get, request.dbName)
  }

  override def restoreDatabase(request: DeleteDBRequest): Future[Boolean] = {
    schemaRepository.restoreDatabase(request.currentOrganizationId.get, request.dbName)
  }

  override def optimizeTable(
      organizationId: Long,
      dbName: String,
      tblName: String,
      primaryKeys: Array[String],
      isUseFinal: Boolean
  ): Future[Boolean] = {
    schemaRepository
      .getTable(organizationId, dbName, tblName)
      .flatMap(tableSchema => {
        tableSchema.getTableType match {
          case TableType.Replacing | TableType.Default =>
            schemaRepository.optimizeTable(
              organizationId,
              tableSchema.dbName,
              tableSchema.defaultShardTblName,
              primaryKeys,
              isUseFinal
            )
          case _ => Future.False
        }
      })
  }

  override def mergeSchemaByProperties(
      organizationId: Long,
      dbName: String,
      tblName: String,
      properties: Map[String, Any]
  ): Future[TableSchema] = {
    val columns: Seq[Column] = ColumnDetector.detectColumns(properties)
    for {
      ensureDb <- ensureDatabaseCreated(organizationId, dbName)
      isTblExists <- schemaRepository.isTableExists(organizationId, dbName, tblName)
      tblSchema <-
        if (isTblExists) {
          schemaRepository
            .mergeColumns(organizationId, dbName, tblName, columns)
            .flatMap(_ => schemaRepository.getTable(organizationId, dbName, tblName))
        } else {
          schemaRepository.createTable(
            organizationId,
            TableSchema(
              organizationId = organizationId,
              dbName = dbName,
              name = tblName,
              displayName = tblName,
              columns = columns
            )
          )
        }
    } yield tblSchema.copy(columns = tblSchema.columns.filterNot(_.isMaterialized()))

  }

  override def ensureDatabaseCreated(
      organizationId: Long,
      name: String,
      displayName: Option[String],
      creatorId: Option[String],
      force: Boolean = false
  ): Future[Unit] =
    Profiler("[SchemaService]::ensureDatabaseCreated") {
      val schema: DatabaseSchema = buildDatabaseSchema(organizationId, name, displayName)
      schemaRepository
        .isDatabaseExists(organizationId, schema.name, force)
        .flatMap {
          case true => Future.Unit
          case false =>
            for {
              createdDb <- schemaRepository.createDatabase(schema, force)
              permissionGranted <- creatorId match {
                case Some(username) =>
                  orgAuthorizationClientService.addPermissions(
                    organizationId = organizationId,
                    username = username,
                    Seq(
                      PermissionProviders.database
                        .withOrganizationId(organizationId)
                        .withDbName(createdDb.name)
                        .all()
                    )
                  )
                case None => Future.True
              }
            } yield createdDb
        }
        .unit
    }

  private def buildDatabaseSchema(
      organizationId: Long,
      name: String,
      displayName: Option[String] = None,
      creatorId: Option[String] = None
  ) = {
    DatabaseSchema(
      name = name,
      organizationId = organizationId,
      displayName =
        displayName.getOrElse(ClickHouseUtils.removeDatabasePrefix(organizationId, name).asPrettyDisplayName),
      creatorId = creatorId.getOrElse(""),
      createdTime = System.currentTimeMillis(),
      updatedTime = System.currentTimeMillis(),
      tables = Seq.empty
    )
  }

  override def updateTableSchema(organizationId: Long, schema: TableSchema): Future[TableSchema] =
    Profiler(s"[Schema] ${this.getClass.getName}::updateTableSchema") {
      hasColumnsEncryption(organizationId, schema).map {
        case false => schemaRepository.updateTable(organizationId, schema)
        case true  => updateAndDoEncryption(organizationId, schema)
      }.flatten
    }

  private def hasColumnsEncryption(organizationId: Long, tableSchema: TableSchema): Future[Boolean] = {
    schemaRepository
      .getTable(organizationId, tableSchema.dbName, tableSchema.name)
      .map(oldTableSchema => {
        (
          findEncryptedColumns(tableSchema, oldTableSchema) ++ findDecryptedColumns(tableSchema, oldTableSchema)
        ).nonEmpty
      })
  }

  private def updateAndDoEncryption(
      organizationId: Long,
      tableSchema: TableSchema
  ): Future[TableSchema] = {
    for {
      oldTableSchema <- schemaRepository.getTable(organizationId, tableSchema.dbName, tableSchema.name)
      encryptedColumns = findEncryptedColumns(tableSchema, oldTableSchema).map(_.name)
      decryptedColumns = findDecryptedColumns(tableSchema, oldTableSchema).map(_.name)
      processingTable <- createProcessingTable(tableSchema)
      newTableSchema <-
        schemaRepository.updateTableMetadata(tableSchema.copy(tableStatus = Some(TableStatus.Processing)))
      _ <- asyncMigrateData(
        sourceTable = processingTable,
        destTable = newTableSchema,
        encryptedColumns,
        decryptedColumns
      )
    } yield newTableSchema
  }

  private def findEncryptedColumns(tableSchema: TableSchema, oldTableSchema: TableSchema): Seq[Column] = {
    tableSchema.columns.filter(column => {
      oldTableSchema.findColumn(column.name) match {
        case Some(oldColumn) => !oldColumn.isEncrypted && column.isEncrypted
        case None            => false
      }
    })
  }

  private def findDecryptedColumns(tableSchema: TableSchema, oldTableSchema: TableSchema): Seq[Column] = {
    tableSchema.columns.filter(column => {
      oldTableSchema.findColumn(column.name) match {
        case Some(oldColumn) => oldColumn.isEncrypted && !column.isEncrypted
        case None            => false
      }
    })
  }

  private def createProcessingTable(tableSchema: TableSchema): Future[TableSchema] = {
    val organizationId: Long = tableSchema.organizationId
    val dbName: String = tableSchema.dbName
    val tblName: String = tableSchema.name
    val processingTblName: String = s"__di_processing_" + tblName + s"_${System.currentTimeMillis()}"
    val tmpTblName: String = "__di_tmp_" + tblName + s"_${System.currentTimeMillis()}"
    for {
      tmpTable <- schemaRepository.createTable(organizationId, tableSchema.copy(name = tmpTblName))
      _ <- schemaRepository.renameTable(organizationId, dbName, tblName, processingTblName)
      _ <- schemaRepository.renameTable(organizationId, dbName, tmpTblName, tblName)
    } yield tmpTable.copy(name = processingTblName)
  }

  private def asyncMigrateData(
      sourceTable: TableSchema,
      destTable: TableSchema,
      encryptedColumns: Seq[String],
      decryptedColumns: Seq[String]
  ): Future[Unit] =
    Future {
      val migrateDataThread: Thread = new Thread {
        override def run(): Unit = {
          info(s"""
               |Start migrate data from ${destTable.dbName}.${destTable.name}
               |to ${sourceTable.dbName}.${sourceTable.name}
               |""".stripMargin)
          try {
            schemaRepository
              .migrateDataWithEncryption(sourceTable, destTable, encryptedColumns, decryptedColumns)
              .map(isSuccess => {
                info(s"""
                   |End migrate data from ${destTable.dbName}.${destTable.name}
                   |to ${sourceTable.dbName}.${sourceTable.name}
                   |success: $isSuccess
                   |""".stripMargin)
                if (isSuccess) {
                  schemaRepository.dropTable(sourceTable.organizationId, sourceTable.dbName, sourceTable.name)
                }
              })
          } catch {
            case ex: Throwable => error(s"Got error when migrate data, message $ex")
          } finally {
            schemaRepository.updateTableMetadata(destTable.copy(tableStatus = Some(TableStatus.Normal)))
          }
        }
      }
      migrateDataThread.start()
    }

  override def createExprColumn(request: CreateExprColumnRequest): Future[TableSchema] = {
    for {
      expressionsResp <- getExpressions(request.dbName, request.tblName)
      _ = checkExpressionExistence(request.column.name, expressionsResp.expressions)
      storageOk <-
        schemaRepository.createExprColumn(request.organizationId, request.dbName, request.tblName, request.column)
      tableSchema <- getTableSchema(request.organizationId, request.dbName, request.tblName)
    } yield tableSchema
  }

  override def updateExprColumn(request: UpdateExprColumnRequest): Future[TableSchema] = {
    for {
      storageOk <-
        schemaRepository.updateExprColumn(request.organizationId, request.dbName, request.tblName, request.column)
      tableSchema <- getTableSchema(request.organizationId, request.dbName, request.tblName)
    } yield tableSchema
  }

  override def deleteExprColumn(request: DeleteExprColumnRequest): Future[Boolean] = {
    schemaRepository.deleteExprColumn(request.organizationId, request.dbName, request.tblName, request.columnName)
  }

  override def createCalcColumn(request: CreateExprColumnRequest): Future[TableSchema] = {
    for {
      expressionsResp <- getExpressions(request.dbName, request.tblName)
      _ = checkExpressionExistence(request.column.name, expressionsResp.expressions)
      storageOk <-
        schemaRepository.createCalcColumn(request.organizationId, request.dbName, request.tblName, request.column)
      tableSchema <- getTableSchema(request.organizationId, request.dbName, request.tblName)
    } yield tableSchema
  }

  @throws[DbNotFoundError]
  @throws[TableNotFoundError]
  override def getTableSchema(organizationId: Long, dbName: String, tblName: String): Future[TableSchema] = {
    getDatabaseSchema(organizationId, dbName).map(_.findTable(tblName))
  }

  @throws[DbNotFoundError]
  override def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    schemaRepository
      .getDatabaseSchema(organizationId, dbName)
      .map(_.removeTemporaryTable())
  }

  override def getExpressions(dbName: String, tblName: String): Future[TableExpressionsResponse] = {
    for {
      tableSchema <- getTableSchema(dbName, tblName)
    } yield {
      TableExpressionsResponse(dbName, tblName, getExpressionsMap(tableSchema))
    }
  }

  @throws[DbNotFoundError]
  @throws[TableNotFoundError]
  override def getTableSchema(dbName: String, tblName: String): Future[TableSchema] = {
    schemaRepository.getDatabaseSchema(dbName).map(_.findTable(tblName))
  }

  private def getExpressionsMap(tableSchema: TableSchema): Map[String, String] = {
    val calculatedExpressions: Map[String, String] = tableSchema.calculatedColumns
      .filter(c => c.defaultExpression.isDefined)
      .map(c => (c.name, c.defaultExpression.get.expr))
      .toMap

    val measureExpressions: Map[String, String] = tableSchema.expressionColumns
      .filter(c => c.defaultExpression.isDefined)
      .map(c => (c.name, c.defaultExpression.get.expr))
      .toMap

    calculatedExpressions ++ measureExpressions
  }

  private def checkExpressionExistence(exprName: String, existedExpression: Map[String, String]): Unit = {
    require(!existedExpression.contains(exprName), s"expression with name $exprName is already existed")
  }

  override def updateCalcColumn(request: UpdateExprColumnRequest): Future[TableSchema] = {
    for {
      storageOk <-
        schemaRepository.updateCalcColumn(request.organizationId, request.dbName, request.tblName, request.column)
      tableSchema <- getTableSchema(request.organizationId, request.dbName, request.tblName)
    } yield tableSchema
  }

  override def deleteCalcColumn(request: DeleteExprColumnRequest): Future[Boolean] = {
    schemaRepository.deleteCalcColumn(request.organizationId, request.dbName, request.tblName, request.columnName)
  }

  /**
    * enhance query with alias field name in select cluase (E.g select name -> select name as name)
    * this is due to a bug of clickhouse that can not recognized a field in where clause when create a view from another views
    * @param columns column that created from this query
    * @param originalQuery query to be enhanced
    * @return
    */
  private def enhanceCreateViewQuery(columns: Array[Column], originalQuery: String): String =
    Profiler("[SchemaService]::enhanceCreateViewQuery") {
      val fromClauseIndex: Int = ClickHouseUtils.findAppropriatePos(originalQuery, SqlRegex.From) // index of "from"
      val originalSelectClause: String = originalQuery.substring(7, fromClauseIndex)
      val selectFields: Array[String] = originalSelectClause.split(",")

      if (selectFields.exists(_.contains("*"))) {
        processWildCardSelect(columns, selectFields, originalQuery, fromClauseIndex)
      } else {
        processFieldsSelect(columns, selectFields, originalQuery, fromClauseIndex)
      }
    }

  private def processWildCardSelect(
      columns: Array[Column],
      selectFields: Array[String],
      originalQuery: String,
      fromClauseIndex: Int
  ): String = {
    if (selectFields.length == 1 && selectFields(0).trim == "*") {
      // if query is: select *, replace with select field names that have aliases
      val selectClause: String = columns.map(c => s"`${c.name}` as `${c.name}`").mkString(", ")
      s"SELECT $selectClause " + originalQuery.substring(fromClauseIndex)
    } else {
      // if query is like: select *, toString(name)..., can not enhance this case, can still produce the bug but the chance is very low
      logger.warn(s"create view with mixed wildcard and expression fields: $originalQuery")
      originalQuery
    }
  }

  private def processFieldsSelect(
      columns: Array[Column],
      selectFields: Array[String],
      originalQuery: String,
      fromClauseIndex: Int
  ): String = {
    // do not escape fields which are functions
    if (columns.length == selectFields.length && !selectFields.exists(field => field.contains("("))) {
      val selectClause: String = columns
        .zip(selectFields)
        .map { case (column, field) => toAliasedField(field, column.name) }
        .mkString(", ")
      s"SELECT $selectClause " + originalQuery.substring(fromClauseIndex)
    } else {
      // does not process query with expression field like: select if(a,b,c), round(a,b)...
      logger.warn(s"create view with expression fields: $originalQuery")
      originalQuery
    }
  }

  private def toAliasedField(fieldStr: String, aliasName: String): String = {
    val isAlreadyAliased: Boolean = fieldStr.toLowerCase.contains("as")
    if (isAlreadyAliased) fieldStr
    else {
      // trim because has space character
      s"${fieldStr.trim.unescape.escape} as ${aliasName.escape}"
    }
  }

  private def filterOwnedDatabases(
      organizationId: Long,
      databases: Seq[DatabaseSchema],
      userName: String
  ): Future[Seq[DatabaseSchema]] =
    Future {
      databases.filter(database => database.creatorId != null && database.creatorId == userName)
    }

  private def getProfile(organizationId: Long, username: String): Future[Option[UserProfile]] = {
    if (username != null)
      profileService.getUserProfile(organizationId, username)
    else
      Future.value(None)
  }
}
