package datainsider.schema.repository

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception._
import datainsider.profiler.Profiler
import datainsider.schema.controller.http.requests.{CreateTableRequest, DeleteColumnRequest}
import datainsider.schema.domain._
import datainsider.schema.domain.column._
import datainsider.schema.domain.column.{Column, ColumnTypes}
import datainsider.schema.util.ColumnDetector.RawColumnData
import datainsider.schema.util.Implicits.ImplicitString
import datainsider.schema.util.ImplicitsFunc._
import datainsider.schema.util.{ClickHouseUtils, ColumnDetector, TableExpressionUtils}

import java.sql.ResultSetMetaData
import scala.concurrent.ExecutionContext.Implicits.global

/**
  * @author andy
  * @since 7/15/20
  */

/**
  * Manage schema use ssdb and click house
  */
trait SchemaRepository {

//  def createDatabaseIfNotExists(organizationId: Long, dbName: String, displayName: Option[String] = None): Future[Unit]

  def isDatabaseExists(organizationId: Long, dbName: String, force: Boolean = false): Future[Boolean]

  /**
    * Check table exists, if force is true, will always check exists in database
    */
  def isTableExists(organizationId: Long, dbName: String, tblName: String, force: Boolean = false): Future[Boolean]

  def existsDatabaseSchema(dbName: String): Future[Boolean]

  def createTableOrOverrideSchema(schema: TableSchema): Future[Boolean]

  def createDatabase(databaseSchema: DatabaseSchema, force: Boolean = false): Future[DatabaseSchema]

  def createDatabase(organizationId: Long, dbName: String, displayName: String): Future[DatabaseSchema]

  def dropDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]]

  @throws[DbNotFoundError]
  def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema]

  def getDatabaseSchemas(organizationId: Long, dbNames: Seq[String]): Future[Seq[DatabaseSchema]]

  @throws[DbNotFoundError]
  def getDatabaseSchema(dbName: String): Future[DatabaseSchema]

  def getTable(organizationId: Long, dbName: String, tblName: String): Future[TableSchema]

  def createTable(createTableRequest: CreateTableRequest): Future[TableSchema]

  def createTable(organizationId: Long, tableSchema: TableSchema): Future[TableSchema]

  def overrideTblSchema(organizationId: Long, tableSchema: TableSchema): Future[TableSchema]

  def addTable(organizationId: Long, tableSchema: TableSchema): Future[TableSchema]

  def updateTable(organizationId: Long, tableSchema: TableSchema): Future[TableSchema]

  def dropTable(organizationId: Long, dbName: String, tblName: String): Future[Boolean]

  def renameTable(organizationId: Long, dbName: String, tblName: String, newTblName: String): Future[Boolean]

  def mergeColumns(organizationId: Long, dbName: String, tblName: String, columns: Seq[Column]): Future[Boolean]

  def updateColumn(organizationId: Long, dbName: String, tblName: String, column: Column): Future[Boolean]

  def dropColumn(dropColumnRequest: DeleteColumnRequest): Future[Boolean]

  /****
    * @return type name of {{expression}}
    */
  def detectExpressionType(
      dbName: String,
      tblName: String,
      expression: String,
      existingExpressions: Map[String, String]
  ): Future[String]

  /****
    * @return type name of {{expression}}
    */
  def detectAggregateExpressionType(
      dbName: String,
      tblName: String,
      expression: String,
      existingExpressions: Map[String, String]
  ): Future[String]

  def detectColumns(query: String): Future[Array[Column]]

  def removeDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def restoreDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def listDeletedDatabases(organizationId: Long): Future[Seq[DatabaseSchema]]

  /**
    * Optimize table https://clickhouse.com/docs/en/sql-reference/statements/optimize/
    * @param dbName name of db
    * @param table name of table
    * @param primaryKeys primary key for optimize, use all columns if empty
    * @param isUseFinal - optimization is performed even when all the data is already in one part. Also merge is forced even if concurrent merges are performed.
    */
  def optimizeTable(
      organizationId: Long,
      dbName: String,
      table: String,
      primaryKeys: Array[String],
      isUseFinal: Boolean
  ): Future[Boolean]

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

case class SchemaRepositoryImpl(
    ddlExecutor: DDLExecutor,
    storage: SchemaMetadataStorage
) extends SchemaRepository
    with Logging {

  def createDatabaseIfNotExists(
      organizationId: Long,
      dbName: String,
      displayName: Option[String] = None
  ): Future[Unit] = {
    isDatabaseExists(organizationId, dbName)
      .flatMap {
        case false =>
          createDatabase(
            organizationId,
            dbName,
            displayName.getOrElse(dbName).asPrettyDisplayName
          )
        case true => Future.Unit
      }
      .flatMap(_ => Future.Unit)
  }

  override def isDatabaseExists(organizationId: Long, dbName: String, force: Boolean = false): Future[Boolean] = {
    if (force) {
      storage.hasDatabaseSchema(organizationId, dbName).flatMap {
        case true => ddlExecutor.existsDatabaseSchema(dbName)
        case _    => Future.False
      }
    } else {
      storage.hasDatabaseSchema(organizationId, dbName)
    }
  }

  override def createDatabase(organizationId: Long, dbName: String, displayName: String): Future[DatabaseSchema] = {
    createDatabase(
      DatabaseSchema(
        name = dbName,
        organizationId,
        displayName,
        "up-83fa61ea-b4fb-4b48-bd93-872d6aaad42e",
        System.currentTimeMillis(),
        System.currentTimeMillis(),
        tables = Seq.empty
      )
    )
  }

  override def createDatabase(schema: DatabaseSchema, force: Boolean = false): Future[DatabaseSchema] = {
    for {
      createSchemaOK <- ddlExecutor.createDatabase(schema.name, force)
      resultOK <- createSchemaOK match {
        case true => storage.addDatabase(schema.organizationId, schema)
        case _    => Future.False
      }
    } yield resultOK match {
      case false => throw DbExecuteError(s"Can't create database: `${schema.name}`")
      case true  => schema
    }
  }

  override def isTableExists(organizationId: Long, dbName: String, tblName: String, force: Boolean): Future[Boolean] = {
    if (force) {
      storage.hasTableSchema(organizationId, dbName, tblName).flatMap {
        case true => ddlExecutor.existTableSchema(dbName, tblName)
        case _    => Future.False
      }
    } else {
      storage.hasTableSchema(organizationId, dbName, tblName)
    }
  }

  override def existsDatabaseSchema(dbName: String): Future[Boolean] = {
    ddlExecutor.existsDatabaseSchema(dbName)
  }

  override def createTableOrOverrideSchema(schema: TableSchema): Future[Boolean] = {
    ddlExecutor.existTableSchema(schema.dbName, schema.name).flatMap {
      case true =>
        this.mergeColumns(
          schema.organizationId,
          schema.dbName,
          schema.name,
          schema.columns
        )
      case _ => createTable(schema.organizationId, schema).map(_ => true)
    }
  }

  override def mergeColumns(
      organizationId: Long,
      dbName: String,
      tblName: String,
      columns: Seq[Column]
  ): Future[Boolean] = {
    for {
      newColumns <- getNonExistColumns(dbName, tblName, columns)
      schemaUpdated <- ddlExecutor.addColumns(dbName, tblName, newColumns)
      saved <- storage.addColumns(organizationId, dbName, tblName, newColumns)
    } yield schemaUpdated && saved
  }

  override def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]] = {
    storage.getDatabases(organizationId)
  }

  override def getDatabaseSchemas(organizationId: Long, dbNames: Seq[String]): Future[Seq[DatabaseSchema]] = {
    storage.getDatabaseSchemas(organizationId, dbNames)
  }

  @throws[DbNotFoundError]
  override def getDatabaseSchema(dbName: String): Future[DatabaseSchema] = {
    storage.getDatabaseSchema(dbName)
  }

  override def dropDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    for {
      dropSchemaOK <- storage.hasOwnership(organizationId, dbName).flatMap {
        case true  => ddlExecutor.dropDatabase(dbName)
        case false => Future.True
      }
      removeDbOK <- storage.deleteDatabaseSchema(organizationId, dbName)
    } yield dropSchemaOK && removeDbOK
  }

  override def createTable(request: CreateTableRequest): Future[TableSchema] = {
    for {
      tableSchema <- Future.value(request.buildTableSchema())
      _ <- ddlExecutor.createTable(tableSchema).map(mustSuccess(_, s"Table ${request.tblName} create failure"))
      updateOK <- storage.addTable(
        tableSchema.organizationId,
        request.dbName,
        tableSchema
      )
    } yield updateOK match {
      case false => throw InternalError(s"Can't create this table: ${request.tblName}")
      case true  => tableSchema
    }
  }

  override def overrideTblSchema(organizationId: Long, tableSchema: TableSchema): Future[TableSchema] = {
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

  override def createTable(
      organizationId: Long,
      tableSchema: TableSchema
  ): Future[TableSchema] = {
    for {
      _ <- ddlExecutor.createTable(tableSchema).map(mustSuccess(_, s"Table ${tableSchema.name} create failure"))
      updateOK <- storage.addTable(
        tableSchema.organizationId,
        tableSchema.dbName,
        tableSchema
      )
    } yield updateOK match {
      case false => throw InternalError(s"Can't create this table: ${tableSchema.name}")
      case true  => tableSchema
    }
  }

  override def dropTable(organizationId: Long, dbName: String, tblName: String): Future[Boolean] = {
    for {
      hasOwnership <- storage.hasOwnership(organizationId, dbName)
      deleteSchemaOK <-
        if (!hasOwnership) Future.False
        else {
          ddlExecutor.dropTable(dbName, tblName)
        }
      deleteTableOK <-
        if (deleteSchemaOK) {
          storage.dropTable(
            organizationId,
            dbName,
            tblName
          )
        } else {
          Future.False
        }
    } yield {
      deleteSchemaOK && deleteTableOK
    }
  }

  override def getTable(organizationId: Long, dbName: String, tblName: String): Future[TableSchema] =
    getDatabaseSchema(organizationId, dbName).map(_.findTable(tblName))

  @throws[DbNotFoundError]
  override def getDatabaseSchema(organizationId: Long, dbName: String): Future[DatabaseSchema] = {
    storage.getDatabaseSchema(organizationId, dbName)
  }

  override def addTable(organizationId: Long, tableSchema: TableSchema): Future[TableSchema] =
    Profiler(s"[Schema] ${this.getClass.getName}::addTable") {
      storage
        .addTable(tableSchema.organizationId, tableSchema.dbName, tableSchema)
        .map {
          case false => throw InternalError(s"Can't add this table: ${tableSchema.name}")
          case true  => tableSchema
        }
    }

  override def renameTable(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newTblName: String
  ): Future[Boolean] = {
    for {
      hasOwnership <- storage.hasOwnership(organizationId, dbName)
      renameSchemaOk <-
        if (!hasOwnership) Future.False
        else {
          ddlExecutor.renameTable(dbName, tblName, newTblName)
        }
      renameTblOk <-
        if (renameSchemaOk) {
          storage.renameTable(
            organizationId,
            dbName,
            tblName,
            newTblName
          )
        } else {
          Future.False
        }
    } yield {
      renameSchemaOk && renameTblOk
    }
  }

  override def detectExpressionType(
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[String] = {
    val query =
      s"select ${TableExpressionUtils.parseFullExpr(newExpr, existingExpressions)} from $dbName.$tblName limit 1"
    for {
      idType <- ddlExecutor.execute(query)(rs => rs.getMetaData.getColumnType(1))
    } yield ColumnTypes.toColumnType(idType)
  }

  override def detectAggregateExpressionType(
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[String] = {
    val query = s"""
         |select ${TableExpressionUtils.parseFullExpr(newExpr, existingExpressions)}
         |from (select * from $dbName.$tblName limit 1)
         |group by 'dummy_col'
         |""".stripMargin

    for {
      idType <- ddlExecutor.execute(query)(rs => rs.getMetaData.getColumnType(1))
    } yield ColumnTypes.toColumnType(idType)
  }

  override def dropColumn(dropRequest: DeleteColumnRequest): Future[Boolean] = {
    for {
      isDdlDropOk <- ddlExecutor.dropColumn(dropRequest.dbName, dropRequest.tblName, dropRequest.columnName)
      isStorageDropOk <- storage.dropColumn(
        dropRequest.organizationId,
        dropRequest.dbName,
        dropRequest.tblName,
        dropRequest.columnName
      )
    } yield {
      isStorageDropOk && isDdlDropOk
    }
  }

  override def updateColumn(organizationId: Long, dbName: String, tblName: String, column: Column): Future[Boolean] = {
    for {
      schemaUpdated <- ddlExecutor.updateColumn(dbName, tblName, column)
      saved <- storage.updateColumn(organizationId, dbName, tblName, column)
    } yield schemaUpdated && saved
  }

  override def detectColumns(query: String): Future[Array[Column]] = {
    val limitedQuery = ClickHouseUtils.applyLimit(query, 0, 1);
    logger.debug(s"detectColumns::query: ${query}, limitedQuery ${limitedQuery}")
    ddlExecutor.execute(limitedQuery)(rs => {
      val metaData = rs.getMetaData;
      Range(1, rs.getMetaData.getColumnCount + 1)
        .map(index => {
          val isNullable = metaData.isNullable(index) == ResultSetMetaData.columnNullable;
          val columnData = RawColumnData(
            name = metaData.getColumnName(index),
            displayName = metaData.getColumnLabel(index),
            idType = metaData.getColumnType(index),
            isNullable = isNullable
          )
          ColumnDetector.createColumn(columnData);
        })
        .toArray
    })
  }

  override def removeDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    storage.removeDatabase(organizationId, dbName)
  }

  override def restoreDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    storage.restoreDatabase(organizationId, dbName)
  }

  override def listDeletedDatabases(organizationId: Long): Future[Seq[DatabaseSchema]] = {
    storage.listDeletedDatabases(organizationId)
  }

  override def optimizeTable(
      organizationId: Long,
      dbName: String,
      table: String,
      primaryKeys: Array[String],
      isUseFinal: Boolean
  ): Future[Boolean] = {
    ddlExecutor.optimizeTable(dbName, table, primaryKeys, isUseFinal = isUseFinal)
  }

  override def updateTable(organizationId: Long, tableSchema: TableSchema): Future[TableSchema] =
    Profiler(s"[Schema] ${this.getClass.getName}::updateTable") {
      for {
        oldTable <- getTable(organizationId, tableSchema.dbName, tableSchema.name)
        _ <- addColumns(tableSchema)
        _ <- updateColumns(tableSchema, oldTable)
        _ <- dropColumns(tableSchema, oldTable)
        updatedTableMetadata <- updateTableMetadata(tableSchema)
      } yield updatedTableMetadata
    }

  private def addColumns(
      newTableSchema: TableSchema
  ): Future[Boolean] =
    Profiler(s"[Schema] ${this.getClass.getName}::addColumns") {
      for {
        nonExistColumns <- getNonExistColumns(newTableSchema.dbName, newTableSchema.name, newTableSchema.columns)
        result <- ddlExecutor.addColumns(newTableSchema.dbName, newTableSchema.name, nonExistColumns)
      } yield result
    }

  private def getNonExistColumns(dbName: String, tblName: String, columns: Seq[Column]): Future[Seq[Column]] = {
    val isNotExistedFn = (existingColumnNameSet: Set[String], column: Column) => {
      !existingColumnNameSet.contains(column.name)
    }

    ddlExecutor
      .getColumnNames(dbName, tblName)
      .map(_.toSet)
      .map(existingColumnNameSet => columns.filter(isNotExistedFn(existingColumnNameSet, _)))
  }

  private def updateColumns(
      tableSchema: TableSchema,
      oldTableSchema: TableSchema
  ): Future[Seq[Boolean]] =
    Profiler(s"[Schema] ${this.getClass.getName}::updateColumns") {
      for {
        changedColumns <- filterChangedColumns(tableSchema.columns, oldTableSchema.columns)
        verifiedColumns <- verifyColumns(changedColumns, oldTableSchema.columns)
        result <- Future.traverseSequentially(verifiedColumns)(column =>
          ddlExecutor.updateColumn(tableSchema.dbName, tableSchema.name, column)
        )
      } yield result
    }

  private def filterChangedColumns(
      newColumns: Seq[Column],
      oldColumns: Seq[Column]
  ): Future[Seq[Column]] =
    Profiler(s"[Schema] ${this.getClass.getName}::filterChangedColumns") {
      Future {
        newColumns.filter(newColumn => isColumnChanged(newColumn, oldColumns))
      }
    }

  private def isColumnChanged(newColumn: Column, oldColumns: Seq[Column]): Boolean =
    Profiler(s"[Schema] ${this.getClass.getName}::isColumnChanged") {
      oldColumns.find(_.name.equals(newColumn.name)) match {
        case None         => false
        case Some(column) => !newColumn.equals(column)
      }
    }

  private def verifyColumns(
      newColumns: Seq[Column],
      oldColumns: Seq[Column]
  ): Future[Seq[Column]] =
    Profiler(s"[Schema] ${this.getClass.getName}::verifyColumns") {
      Future {
        newColumns.filter(newColumn => verifyColumn(newColumn, oldColumns))
      }
    }

  private def verifyColumn(newColumn: Column, oldColumns: Seq[Column]): Boolean =
    Profiler(s"[Schema] ${this.getClass.getName}::verifyColumn") {
      oldColumns.find(_.name.equals(newColumn.name)) match {
        case None         => false
        case Some(column) => verifyNullableColumn(newColumn, column)
      }
    }

  private def verifyNullableColumn(newColumn: Column, oldColumn: Column): Boolean =
    Profiler(s"[Schema] ${this.getClass.getName}::verifyNullableColumn") {
      if (!newColumn.isNullable && oldColumn.isNullable) {
        throw BadRequestError(s"Column ${newColumn.displayName} can't be updated to not null column")
      } else {
        true
      }
    }

  private def dropColumns(
      tableSchema: TableSchema,
      oldTableSchema: TableSchema
  ): Future[Seq[Boolean]] =
    Profiler(s"[Schema] ${this.getClass.getName}::dropColumns") {
      val redundantColumns: Seq[Column] = oldTableSchema.columns.filter(oldColumn => {
        tableSchema.findColumn(oldColumn.name).isEmpty
      })
      Future.traverseSequentially(redundantColumns)(column =>
        ddlExecutor.dropColumn(tableSchema.dbName, tableSchema.name, column.name)
      )
    }

  override def updateTableMetadata(tableSchema: TableSchema): Future[TableSchema] = {
    Profiler(s"[Schema] ${this.getClass.getName}::updateTableMetadata") {
      storage
        .addTable(tableSchema.organizationId, tableSchema.dbName, tableSchema)
        .map {
          case false => throw InternalError(s"Can't add this table: ${tableSchema.name}")
          case true  => tableSchema
        }
    }
  }

  override def migrateDataWithEncryption(
      sourceTable: TableSchema,
      destTable: TableSchema,
      encryptedColumns: Seq[String],
      decryptedColumns: Seq[String]
  ): Future[Boolean] = {
    ddlExecutor.migrateDataWithEncryption(sourceTable, destTable, encryptedColumns, decryptedColumns)
  }

  override def createExprColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newExpColumn: Column
  ): Future[Column] = {
    for {
      ok <- storage.addExpressionColumn(organizationId, dbName, tblName, newExpColumn)
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
      ok <- storage.updateExpressionColumn(organizationId, dbName, tblName, newExpColumn)
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
    storage.dropExpressionColumn(organizationId, dbName, tblName, columnName)
  }

  override def createCalcColumn(
      organizationId: Long,
      dbName: String,
      tblName: String,
      newCalcColumn: Column
  ): Future[Column] = {
    for {
      ok <- storage.addCalculatedColumn(organizationId, dbName, tblName, newCalcColumn)
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
      ok <- storage.updateCalculatedColumn(organizationId, dbName, tblName, newCalcColumn)
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
    storage.dropCalculatedColumn(organizationId, dbName, tblName, columnName)
  }

}
