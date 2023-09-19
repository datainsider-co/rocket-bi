package co.datainsider.schema.repository

import co.datainsider.bi.domain.Connection
import co.datainsider.bi.engine.Engine
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.service.ConnectionService
import co.datainsider.schema.domain.column.Column
import co.datainsider.schema.domain.requests.DeleteColumnRequest
import co.datainsider.schema.domain.{DatabaseSchema, DatabaseShortInfo, TableSchema, TableType}
import com.twitter.util.{Future, Return, Throw}
import com.twitter.util.logging.Logging
import datainsider.client.exception._

import javax.inject.Inject

/**
  * @author andy
  * @since 7/15/20
  */

/**
  * Manage schema use ssdb and click house
  */
trait SchemaRepository {

  def isDatabaseExists(organizationId: Long, dbName: String, useDDLQuery: Boolean = false): Future[Boolean]

  /**
    * Check table exists, if useDdlQuery is true, will always check exists in database
    */
  def isTableExists(
      organizationId: Long,
      dbName: String,
      tblName: String,
      colNames: Seq[String] = Seq.empty,
      useDdlQuery: Boolean = false
  ): Future[Boolean]
  def createTableOrOverrideSchema(schema: TableSchema): Future[Boolean]

  def createDatabase(databaseSchema: DatabaseSchema): Future[DatabaseSchema]

  def createDatabase(
      organizationId: Long,
      dbName: String,
      displayName: String
  ): Future[DatabaseSchema]

  def dropDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def getDatabases(organizationId: Long): Future[Seq[DatabaseShortInfo]]

  @throws[DbNotFoundError]
  def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema]

  def getDatabaseSchemas(organizationId: Long, dbNames: Seq[String]): Future[Seq[DatabaseSchema]]

  @throws[DbNotFoundError]
  def getDatabaseSchema(dbName: String): Future[DatabaseSchema]

  def getTable(organizationId: Long, dbName: String, tblName: String): Future[TableSchema]

  def createTable(organizationId: Long, tableSchema: TableSchema): Future[TableSchema]

  def overrideTblSchema(organizationId: Long, tableSchema: TableSchema): Future[TableSchema]

  def updateTable(organizationId: Long, tableSchema: TableSchema): Future[TableSchema]

  def dropTable(organizationId: Long, dbName: String, tblName: String): Future[Boolean]

  def renameTable(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean]

  def mergeColumns(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columns: Seq[Column]
  ): Future[Boolean]

  def updateColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      column: Column
  ): Future[Boolean]

  def dropColumn(dropColumnRequest: DeleteColumnRequest): Future[Boolean]

  /** **
    * @return type name of {{expression}}
    */
  def detectExpressionType(
      organizationId: Long,
      dbName: String,
      tblName: String,
      expression: String,
      existingExpressions: Map[String, String]
  ): Future[String]

  /** **
    * @return type name of {{expression}}
    */
  def detectAggregateExpressionType(
      organizationId: Long,
      dbName: String,
      tblName: String,
      expression: String,
      existingExpressions: Map[String, String]
  ): Future[String]

  def detectColumns(orgId: Long, query: String): Future[Array[Column]]

  def removeDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def restoreDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def listDeletedDatabases(organizationId: Long): Future[Seq[DatabaseShortInfo]]

  def updateTableMetadata(tableSchema: TableSchema): Future[TableSchema]

  def migrateDataWithEncryption(
      sourceTable: TableSchema,
      destTable: TableSchema,
      encryptedColumns: Seq[String],
      decryptedColumns: Seq[String]
  ): Future[Boolean]

  def createExprColumn(organizationId: Long, dbName: String, tblName: String, newExpColumn: Column): Future[Column]

  def updateExprColumn(organizationId: Long, dbName: String, tblName: String, newExpColumn: Column): Future[Column]

  def deleteExprColumn(organizationId: Long, dbName: String, tblName: String, columnName: String): Future[Boolean]

  def createCalcColumn(organizationId: Long, dbName: String, tblName: String, newCalcColumn: Column): Future[Column]

  def updateCalcColumn(organizationId: Long, dbName: String, tblName: String, newCalcColumn: Column): Future[Column]

  def deleteCalcColumn(organizationId: Long, dbName: String, tblName: String, columnName: String): Future[Boolean]
}

case class SchemaRepositoryImpl @Inject() (
    connectionService: ConnectionService,
    engineFactoryResolver: EngineResolver,
    schemaStorage: SchemaMetadataStorage
) extends SchemaRepository
    with Logging {

  def resolveDDLExecutor(organizationId: Long): Future[DDLExecutor] = {
    connectionService.getTunnelConnection(organizationId).map { source =>
      engineFactoryResolver.resolve(source.getClass).asInstanceOf[Engine[Connection]].getDDLExecutor(source)
    }
  }

  override def isDatabaseExists(organizationId: Long, dbName: String, useDdlQuery: Boolean): Future[Boolean] = {
    if (useDdlQuery) {
      resolveDDLExecutor(organizationId).flatMap(_.existsDatabaseSchema(dbName))
    } else {
      schemaStorage.hasDatabaseSchema(organizationId, dbName)
    }
  }

  override def isTableExists(
      organizationId: Long,
      dbName: String,
      tblName: String,
      colNames: Seq[String] = Seq.empty,
      useDdlQuery: Boolean = false
  ): Future[Boolean] = {
    if (useDdlQuery) {
      resolveDDLExecutor(organizationId).flatMap(_.existTableSchema(dbName, tblName, colNames))
    } else {
      schemaStorage.isExists(organizationId, dbName, tblName, colNames)
    }
  }

  override def createDatabase(
      organizationId: Long,
      dbName: String,
      displayName: String
  ): Future[DatabaseSchema] = {
    createDatabase(
      DatabaseSchema(
        name = dbName,
        organizationId,
        displayName,
        "up-83fa61ea-b4fb-4b48-bd93-872d6aaad42e", //FIXME: wtf
        System.currentTimeMillis(),
        System.currentTimeMillis(),
        tables = Seq.empty
      )
    )
  }

  override def createTableOrOverrideSchema(schema: TableSchema): Future[Boolean] = {
    for {
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(schema.organizationId)
      isTableExisted: Boolean <- ddlExecutor.existTableSchema(schema.dbName, schema.name)
      isSuccess <- isTableExisted match {
        case true =>
          this.mergeColumns(
            schema.organizationId,
            schema.dbName,
            schema.name,
            schema.columns
          )
        case _ => createTable(schema.organizationId, schema).map(_ => true)
      }
    } yield isSuccess
  }

  override def createDatabase(schema: DatabaseSchema): Future[DatabaseSchema] = {
    for {
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(schema.organizationId)
      createSchemaOK: Boolean <- ddlExecutor.createDatabase(schema.name)
      resultOK <- createSchemaOK match {
        case true => schemaStorage.addDatabase(schema.organizationId, schema)
        case _    => Future.False
      }
    } yield resultOK match {
      case false => throw DbExecuteError(s"Can't create database: `${schema.name}`")
      case true  => schema
    }
  }

  override def getDatabases(organizationId: Long): Future[Seq[DatabaseShortInfo]] = {
    schemaStorage.getDatabaseShortInfos(organizationId)
  }

  @throws[DbNotFoundError]
  override def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    schemaStorage.getDatabaseSchema(organizationId, dbName)
  }
  override def getDatabaseSchemas(organizationId: Long, dbNames: Seq[String]): Future[Seq[DatabaseSchema]] = {
    schemaStorage.getDatabaseSchemas(organizationId, dbNames)
  }

  @throws[DbNotFoundError]
  override def getDatabaseSchema(dbName: String): Future[DatabaseSchema] = {
    schemaStorage.getDatabaseSchema(dbName)
  }

  override def dropDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    for {
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(organizationId)
      isDDLDeleted <- ddlExecutor.existsDatabaseSchema(dbName).flatMap {
        case true  => ddlExecutor.dropDatabase(dbName)
        case false => Future.True
      }
      isStorageDeleted <- isDDLDeleted match {
        case true  => schemaStorage.hardDelete(organizationId, dbName)
        case false => Future.False
      }
    } yield {
      isDDLDeleted && isStorageDeleted
    }
  }

  override def createTable(
      organizationId: Long,
      tableSchema: TableSchema
  ): Future[TableSchema] = {
    for {
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(organizationId)
      _ <-
        ddlExecutor
          .createTable(tableSchema)
          .map(isSuccess =>
            if (!isSuccess) {
              s"Table ${tableSchema.name} create failure"
            }
          )
      updateOK <- schemaStorage.addTable(
        tableSchema.organizationId,
        tableSchema.dbName,
        tableSchema
      )
    } yield updateOK match {
      case false => throw InternalError(s"Can't create this table: ${tableSchema.name}")
      case true  => tableSchema
    }
  }

  override def overrideTblSchema(
      organizationId: Long,
      tableSchema: TableSchema
  ): Future[TableSchema] = {
    for {
      isViewTable <- getTable(organizationId, tableSchema.dbName, tableSchema.name).map(schema => {
        if (schema.getTableType != TableType.View) {
          throw BadRequestError(s"Can't override tables which are different from view type: ${tableSchema.name}")
        }
      })
      tblDeleted <- dropTable(organizationId, tableSchema.dbName, tableSchema.name)
      createdTblSchema <- createTable(organizationId, tableSchema)
    } yield createdTblSchema
  }

  override def dropTable(
      organizationId: Long,
      dbName: String,
      tblName: String
  ): Future[Boolean] = {
    for {
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(organizationId)
      isDDLExists <- ddlExecutor.existTableSchema(dbName, tblName)
      tableType <- getTable(organizationId, dbName, tblName).transform {
        case Return(schema) => Future.value(Option(schema.getTableType))
        case Throw(e)       => Future.None
      }
      isDDLDeleted <- isDDLExists match {
        case true  => ddlExecutor.dropTable(dbName, tblName, tableType.getOrElse(TableType.Default))
        case false => Future.True
      }
      isStorageDeleted <- isDDLDeleted match {
        case true  => schemaStorage.dropTable(organizationId, dbName, tblName)
        case false => Future.False
      }
    } yield isDDLDeleted && isStorageDeleted
  }

  override def renameTable(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean] = {
    for {
      isStorageExists <- schemaStorage.isExists(organizationId, dbName)
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(organizationId)
      isDDLRenameOk <- isStorageExists match {
        case true  => ddlExecutor.renameTable(dbName, tblName, newTblName)
        case false => Future.False
      }
      isStorageRenameOk <- isDDLRenameOk match {
        case true  => schemaStorage.renameTable(organizationId, dbName, tblName, newTblName)
        case false => Future.False
      }
    } yield {
      isDDLRenameOk && isStorageRenameOk
    }
  }

  override def mergeColumns(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columns: Seq[Column]
  ): Future[Boolean] = {
    for {
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(organizationId)
      newColumns <- getNonExistColumns(organizationId, dbName, tblName, columns)
      schemaUpdated <- ddlExecutor.addColumns(dbName, tblName, newColumns)
      saved <- schemaStorage.addColumns(organizationId, dbName, tblName, newColumns)
    } yield schemaUpdated && saved
  }

  private def getNonExistColumns(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columns: Seq[Column]
  ): Future[Seq[Column]] = {
    val isNotExistedFn = (existingColumnNameSet: Set[String], column: Column) => {
      !existingColumnNameSet.contains(column.name)
    }
    for {
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(organizationId)
      existingColumnNameSet: Set[String] <- ddlExecutor.getColumnNames(dbName, tblName).map(_.toSet)
    } yield {
      columns.filter(isNotExistedFn(existingColumnNameSet, _))
    }
  }

  override def detectExpressionType(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[String] = {
    for {
      source <- connectionService.getTunnelConnection(organizationId)
      engine = engineFactoryResolver.resolve(source.getClass).asInstanceOf[Engine[Connection]]
      column: Column <- engine.detectExpressionColumn(source, dbName, tblName, newExpr, existingExpressions)
    } yield Column.getCustomClassName(column)
  }

  override def detectAggregateExpressionType(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[String] = {
    for {
      source <- connectionService.getTunnelConnection(organizationId)
      engine = engineFactoryResolver.resolve(source.getClass).asInstanceOf[Engine[Connection]]
      column <- engine.detectAggregateExpressionColumn(source, dbName, tblName, newExpr, existingExpressions)
    } yield Column.getCustomClassName(column)
  }

  override def dropColumn(dropRequest: DeleteColumnRequest): Future[Boolean] = {
    for {
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(dropRequest.getOrganizationId())
      isExecuted <- ddlExecutor.dropColumn(dropRequest.dbName, dropRequest.tblName, dropRequest.columnName)
      isStored <- schemaStorage.dropColumn(
        dropRequest.organizationId,
        dropRequest.dbName,
        dropRequest.tblName,
        dropRequest.columnName
      )
    } yield {
      isStored && isExecuted
    }
  }

  override def getTable(organizationId: Long, dbName: String, tblName: String): Future[TableSchema] =
    getDatabaseSchema(organizationId, dbName).map(_.findTable(tblName))

  override def updateColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      column: Column
  ): Future[Boolean] = {
    for {
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(organizationId)
      schemaUpdated <- ddlExecutor.updateColumn(dbName, tblName, column)
      saved <- schemaStorage.updateColumn(organizationId, dbName, tblName, column)
    } yield schemaUpdated && saved
  }

  override def detectColumns(organizationId: Long, query: String): Future[Array[Column]] = {
    for {
      ddlExecutor <- resolveDDLExecutor(organizationId)
      columns <- ddlExecutor.detectColumns(query)
    } yield columns.toArray
  }

  override def removeDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    schemaStorage.removeDatabase(organizationId, dbName)
  }

  override def restoreDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    schemaStorage.restoreDatabase(organizationId, dbName)
  }

  override def listDeletedDatabases(organizationId: Long): Future[Seq[DatabaseShortInfo]] = {
    schemaStorage.listDeletedDatabases(organizationId)
  }

  override def updateTable(
      organizationId: Long,
      tableSchema: TableSchema
  ): Future[TableSchema] = {
    for {
      oldTable <- getTable(organizationId, tableSchema.dbName, tableSchema.name)
      _ <- addColumns(organizationId, tableSchema)
      _ <- updateColumns(organizationId, tableSchema, oldTable)
      _ <- dropColumns(organizationId, tableSchema, oldTable)
      updatedTableMetadata <- updateTableMetadata(tableSchema)
    } yield updatedTableMetadata
  }

  private def addColumns(
      organizationId: Long,
      newTableSchema: TableSchema
  ): Future[Boolean] = {
    for {
      nonExistColumns <-
        getNonExistColumns(organizationId, newTableSchema.dbName, newTableSchema.name, newTableSchema.columns)
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(organizationId)
      result <- ddlExecutor.addColumns(newTableSchema.dbName, newTableSchema.name, nonExistColumns)
    } yield result
  }

  private def updateColumns(
      organizationId: Long,
      tableSchema: TableSchema,
      oldTableSchema: TableSchema
  ): Future[Seq[Boolean]] = {
    for {
      changedColumns <- filterChangedColumns(tableSchema.columns, oldTableSchema.columns)
      verifiedColumns <- verifyColumns(changedColumns, oldTableSchema.columns)
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(organizationId)
      result <- Future.traverseSequentially(verifiedColumns)(column =>
        ddlExecutor.updateColumn(tableSchema.dbName, tableSchema.name, column)
      )
    } yield result
  }

  private def dropColumns(
      organizationId: Long,
      tableSchema: TableSchema,
      oldTableSchema: TableSchema
  ): Future[Seq[Boolean]] = {
    val redundantColumns: Seq[Column] = oldTableSchema.columns.filter(oldColumn => {
      tableSchema.findColumn(oldColumn.name).isEmpty
    })
    Future.traverseSequentially(redundantColumns)(column =>
      resolveDDLExecutor(organizationId).flatMap(_.dropColumn(tableSchema.dbName, tableSchema.name, column.name))
    )
  }

  private def filterChangedColumns(
      newColumns: Seq[Column],
      oldColumns: Seq[Column]
  ): Future[Seq[Column]] =
    Future {
      newColumns.filter(newColumn => isColumnChanged(newColumn, oldColumns))
    }

  private def isColumnChanged(newColumn: Column, oldColumns: Seq[Column]): Boolean = {
    oldColumns.find(_.name.equals(newColumn.name)) match {
      case None         => false
      case Some(column) => !newColumn.equals(column)
    }
  }

  private def verifyColumns(
      newColumns: Seq[Column],
      oldColumns: Seq[Column]
  ): Future[Seq[Column]] = {
    Future {
      newColumns.filter(newColumn => verifyColumn(newColumn, oldColumns))
    }
  }

  private def verifyColumn(newColumn: Column, oldColumns: Seq[Column]): Boolean = {
    oldColumns.find(_.name.equals(newColumn.name)) match {
      case None         => false
      case Some(column) => verifyNullableColumn(newColumn, column)
    }
  }

  private def verifyNullableColumn(newColumn: Column, oldColumn: Column): Boolean = {
    if (!newColumn.isNullable && oldColumn.isNullable) {
      throw BadRequestError(s"Column ${newColumn.displayName} can't be updated to not null column")
    } else {
      true
    }
  }

  override def updateTableMetadata(tableSchema: TableSchema): Future[TableSchema] = {
    schemaStorage
      .updateTable(tableSchema.organizationId, tableSchema.dbName, tableSchema.name, tableSchema)
      .map {
        case false => throw InternalError(s"Can't add this table: ${tableSchema.name}")
        case true  => tableSchema
      }
  }

  override def migrateDataWithEncryption(
      sourceTable: TableSchema,
      destTable: TableSchema,
      encryptedColumns: Seq[String],
      decryptedColumns: Seq[String]
  ): Future[Boolean] = {
    for {
      ddlExecutor: DDLExecutor <- resolveDDLExecutor(sourceTable.organizationId)
      result: Boolean <- ddlExecutor.migrateDataWithEncryption(
        sourceTable,
        destTable,
        encryptedColumns,
        decryptedColumns
      )
    } yield result
  }

  override def createExprColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Column] = {
    for {
      ok <- schemaStorage.addExpressionColumn(organizationId, dbName, tblName, newExpColumn)
    } yield {
      if (ok) newExpColumn
      else throw DbExecuteError("createExprColumn failed")
    }
  }

  override def updateExprColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Column] = {
    for {
      ok <- schemaStorage.updateExpressionColumn(organizationId, dbName, tblName, newExpColumn)
    } yield {
      if (ok) newExpColumn
      else throw DbExecuteError("updateExprColumn failed")
    }
  }

  override def deleteExprColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] = {
    schemaStorage.dropExpressionColumn(organizationId, dbName, tblName, columnName)
  }

  override def createCalcColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Column] = {
    for {
      ok <- schemaStorage.addCalculatedColumn(organizationId, dbName, tblName, newCalcColumn)
    } yield {
      if (ok) newCalcColumn
      else throw DbExecuteError("createCalcColumn failed")
    }
  }

  override def updateCalcColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Column] =
    for {
      ok <- schemaStorage.updateCalculatedColumn(organizationId, dbName, tblName, newCalcColumn)
    } yield {
      if (ok) newCalcColumn
      else throw DbExecuteError("updateCalcColumn failed")
    }

  override def deleteCalcColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] = {
    schemaStorage.dropCalculatedColumn(organizationId, dbName, tblName, columnName)
  }
}
