package datainsider.ingestion.repository

import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.analytics.misc.ColumnDetector
import datainsider.analytics.misc.ColumnDetector.RawColumnData
import datainsider.client.exception._
import datainsider.client.util.ComputeExprUtils
import datainsider.data_cook.domain.Ids.OrganizationId
import datainsider.ingestion.controller.http.requests.DeleteColumnRequest
import datainsider.ingestion.domain._
import datainsider.ingestion.util.ClickHouseUtils
import datainsider.ingestion.util.ImplicitsFunc._
import datainsider.profiler.Profiler

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

  def existsDatabaseSchema(dbName: String): Future[Boolean]

  def createTableOrOverrideSchema(schema: TableSchema): Future[Boolean]

  def createDatabase(databaseSchema: DatabaseSchema): Future[DatabaseSchema]

  def createDatabase(
      organizationId: Long,
      dbName: String,
      displayName: String
  ): Future[DatabaseSchema]

  def dropDatabase(organizationId: Long, dbName: String): Future[Boolean]

  def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]]

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

  def execLongRunningProcess(seconds: Int): Future[Int]
}

case class SchemaRepositoryImpl(
    ddlExecutor: DDLExecutor,
    schemaStorage: SchemaMetadataStorage
) extends SchemaRepository
    with Logging {

  override def isDatabaseExists(organizationId: Long, dbName: String, useDdlQuery: Boolean): Future[Boolean] = {
    if (useDdlQuery) {
      ddlExecutor.existsDatabaseSchema(dbName)
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
      ddlExecutor.existTableSchema(dbName, tblName, colNames)
    } else {
      schemaStorage.isExists(organizationId, dbName, tblName, colNames)
    }
  }

  override def existsDatabaseSchema(dbName: String): Future[Boolean] = {
    ddlExecutor.existsDatabaseSchema(dbName)
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

  override def createDatabase(schema: DatabaseSchema): Future[DatabaseSchema] = {
    for {
      createSchemaOK <- ddlExecutor.createDatabase(schema.name)
      resultOK <- createSchemaOK match {
        case true => schemaStorage.addDatabase(schema.organizationId, schema)
        case _    => Future.False
      }
    } yield resultOK match {
      case false => throw DbExecuteError(s"Can't create database: `${schema.name}`")
      case true  => schema
    }
  }

  override def getDatabases(organizationId: Long): Future[Seq[DatabaseSchema]] = {
    schemaStorage.getDatabases(organizationId)
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
      isDDLDeleted <- ddlExecutor.existsDatabaseSchema(dbName).flatMap {
        case true  => ddlExecutor.dropDatabase(dbName)
        case false => Future.True
      }
      isStorageDeleted <- isDDLDeleted match {
        case true  => schemaStorage.hardDelete(organizationId, dbName)
        case false => Future.False
      }
    } yield {
      logger.info(s"drop databases ${dbName}, isDDLDeleted:: ${isDDLDeleted}, isStorageDeleted: ${isStorageDeleted}")
      isDDLDeleted && isStorageDeleted
    }
  }

  override def createTable(
      organizationId: Long,
      tableSchema: TableSchema
  ): Future[TableSchema] = {
    for {
      _ <-
        ddlExecutor
          .createTable(tableSchema)
          .map(mustSuccess(_, s"Table ${tableSchema.name} create failure"))
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
      organizationId: OrganizationId,
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
      isDDLExists <- ddlExecutor.existTableSchema(dbName, tblName)
      isDDLDeleted <- isDDLExists match {
        case true  => ddlExecutor.dropTable(dbName, tblName)
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
      newColumns <- getNonExistColumns(dbName, tblName, columns)
      schemaUpdated <- ddlExecutor.addColumns(dbName, tblName, newColumns)
      saved <- schemaStorage.addColumns(organizationId, dbName, tblName, newColumns)
    } yield schemaUpdated && saved
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

  override def detectExpressionType(
      dbName: String,
      tblName: String,
      newExpr: String,
      existingExpressions: Map[String, String]
  ): Future[String] = {
    val withExistingExpressions: String = buildCteClause(existingExpressions)

    val query =
      s"""
         |$withExistingExpressions
         |select $newExpr
         |from $dbName.$tblName limit 1
         |""".stripMargin

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
    val withExistingExpressions: String = buildCteClause(existingExpressions)

    val mainExpression: String = if (ComputeExprUtils.isComputeExpr(newExpr)) {
      ComputeExprUtils.getMainExpression(newExpr)
    } else newExpr

    val query = s"""
         |$withExistingExpressions
         |select $mainExpression
         |from (select * from $dbName.$tblName limit 1)
         |group by 'dummy_col'
         |""".stripMargin

    for {
      idType <- ddlExecutor.execute(query)(rs => rs.getMetaData.getColumnType(1))
    } yield ColumnTypes.toColumnType(idType)
  }

  override def dropColumn(dropRequest: DeleteColumnRequest): Future[Boolean] = {
    for {
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
      schemaUpdated <- ddlExecutor.updateColumn(dbName, tblName, column)
      saved <- schemaStorage.updateColumn(organizationId, dbName, tblName, column)
    } yield schemaUpdated && saved
  }

  override def detectColumns(query: String): Future[Array[Column]] = {
    val limitedQuery = ClickHouseUtils.applyLimit(query, 0, 1);
    logger.debug(s"detectColumns::query: ${query}, limitedQuery ${limitedQuery}")
    ddlExecutor.execute(limitedQuery)(rs => {
      val metaData = rs.getMetaData
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
    schemaStorage.removeDatabase(organizationId, dbName)
  }

  override def restoreDatabase(organizationId: Long, dbName: String): Future[Boolean] = {
    schemaStorage.restoreDatabase(organizationId, dbName)
  }

  override def listDeletedDatabases(organizationId: Long): Future[Seq[DatabaseSchema]] = {
    schemaStorage.listDeletedDatabases(organizationId)
  }

  override def updateTable(
      organizationId: Long,
      tableSchema: TableSchema
  ): Future[TableSchema] =
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

  override def updateTableMetadata(tableSchema: TableSchema): Future[TableSchema] = {
    Profiler(s"[Schema] ${this.getClass.getName}::updateTableMetadata") {
      schemaStorage
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
      organizationId: OrganizationId,
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
      organizationId: OrganizationId,
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
      organizationId: OrganizationId,
      dbName: String,
      tblName: String,
      columnName: String
  ): Future[Boolean] = {
    schemaStorage.dropCalculatedColumn(organizationId, dbName, tblName, columnName)
  }

  override def execLongRunningProcess(seconds: Int): Future[Int] = {
    val query = s"select sleepEachRow(1) from numbers($seconds)"

    ddlExecutor.execute(query)(rs => {
      var count = 0

      while (rs.next()) {
        count += 1
      }

      count
    })
  }

  private def buildCteClause(expressions: Map[String, String]): String = {
    if (expressions.nonEmpty) {
      val cteFields: Iterable[String] = expressions.map {
        case (exprName, expr) => s"(${getFinalExpr(expr)}) as $exprName"
      }

      s"with ${cteFields.mkString(",\n")}"
    } else ""
  }

  private def getFinalExpr(expr: String): String = {
    if (ComputeExprUtils.isComputeExpr(expr)) {
      ComputeExprUtils.getMainExpression(expr)
    } else expr
  }

}
