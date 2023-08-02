package co.datainsider.bi.engine.bigquery

import co.datainsider.bi.client.BigQueryClient
import co.datainsider.schema.domain.TableType.TableType
import co.datainsider.schema.domain.column.Column
import co.datainsider.schema.domain.{TableSchema, TableType}
import co.datainsider.schema.repository.DDLExecutor
import com.google.cloud.bigquery.BigQuery.{DatasetDeleteOption, TableOption}
import com.google.cloud.bigquery._
import com.twitter.util.Future
import com.twitter.util.logging.Logging
import datainsider.client.exception.{InternalError, NotFoundError}

import scala.jdk.CollectionConverters.iterableAsScalaIterableConverter

/**
  * created 2023-06-05 3:24 PM
  *
  * @author tvc12 - Thien Vi
  */
class BigQueryDDLExecutor(bigQueryClient: BigQueryClient) extends DDLExecutor with Logging {
  private val clazz = getClass.getSimpleName

  private val bigQuery = bigQueryClient.bigquery

  override def existsDatabaseSchema(dbName: String): Future[Boolean] =
    Future {
      bigQuery.getDataset(dbName) != null
    }

  override def existTableSchema(dbName: String, tblName: String, colNames: Seq[String]): Future[Boolean] = {
    Future {
      bigQuery.getTable(TableId.of(dbName, tblName)) != null
    }
  }

  override def getDbNames(): Future[Seq[String]] = {
    Future {
      bigQuery.listDatasets().iterateAll().asScala.map(_.getDatasetId.getDataset).toSeq
    }
  }

  override def dropDatabase(dbName: String): Future[Boolean] = {
    Future {
      try {
        bigQuery.delete(dbName, DatasetDeleteOption.deleteContents())
        true
      } catch {
        case ex: BigQueryException =>
          logger.error(s"$clazz.dropDatabase: $dbName", ex)
          throw InternalError(s"Drop database failed with error: ${ex.getMessage}")
      }
    }
  }

  override def getTableNames(dbName: String): Future[Seq[String]] = {
    Future {
      bigQuery.listTables(dbName).iterateAll().asScala.map(_.getTableId.getTable).toSeq
    }
  }

  override def scanTables(orgId: Long, dbName: String): Future[Seq[TableSchema]] = {
    Future {
      bigQuery
        .listTables(dbName)
        .iterateAll()
        .asScala
        .map { tempTable: Table =>
          val table: Table = getTable(dbName, tempTable.getTableId.getTable)
          table.getDefinition[TableDefinition] match {
            case viewDefinition: ViewDefinition              => toViewSchema(orgId, table, viewDefinition)
            case tableDefinition: MaterializedViewDefinition => toMaterializedViewSchema(orgId, table, tableDefinition)
            case tableDefinition: StandardTableDefinition    => toDefaultTableSchema(orgId, table, tableDefinition)
            case _                                           => toDefaultTableSchema(orgId, table, table.getDefinition[TableDefinition])
          }
        }
        .toSeq
    }
  }

  private def toViewSchema(orgId: Long, table: Table, viewDefinition: ViewDefinition): TableSchema = {
    val columns: Seq[Column] = BigQueryUtils.parseColumns(viewDefinition.getSchema)
    TableSchema(
      name = table.getTableId.getTable,
      dbName = table.getTableId.getDataset,
      organizationId = orgId,
      displayName = table.getFriendlyName,
      columns = columns,
      engine = None,
      primaryKeys = Seq.empty,
      partitionBy = Seq.empty,
      orderBys = Seq.empty,
      query = scala.Option(viewDefinition.getQuery),
      tableType = Some(TableType.View),
      tableStatus = None,
      ttl = None
    )
  }

  private def toMaterializedViewSchema(
      orgId: Long,
      table: Table,
      tableDefinition: MaterializedViewDefinition
  ): TableSchema = {
    val columns: Seq[Column] = BigQueryUtils.parseColumns(tableDefinition.getSchema)
    TableSchema(
      name = table.getTableId.getTable,
      dbName = table.getTableId.getDataset,
      organizationId = orgId,
      displayName = table.getFriendlyName,
      columns = columns,
      engine = None,
      primaryKeys = Seq.empty,
      partitionBy = Seq.empty,
      orderBys = Seq.empty,
      query = scala.Option(tableDefinition.getQuery),
      tableType = Some(TableType.Materialized),
      tableStatus = None,
      ttl = None
    )
  }

  private def toDefaultTableSchema(orgId: Long, table: Table, tableDefinition: TableDefinition): TableSchema = {
    val columns: Seq[Column] = BigQueryUtils.parseColumns(tableDefinition.getSchema)
    TableSchema(
      name = table.getTableId.getTable,
      dbName = table.getTableId.getDataset,
      organizationId = orgId,
      displayName = table.getFriendlyName,
      columns = columns,
      engine = None,
      primaryKeys = Seq.empty,
      partitionBy = Seq.empty,
      orderBys = Seq.empty,
      query = None,
      tableType = Some(TableType.Default),
      tableStatus = None,
      ttl = None
    )
  }

  override def dropTable(dbName: String, tblName: String): Future[Boolean] = {
    Future {
      try {
        bigQuery.delete(TableId.of(dbName, tblName))
        true
      } catch {
        case ex: BigQueryException =>
          logger.error(s"$clazz.dropTable: $dbName.$tblName", ex)
          throw InternalError(s"Drop table failed with error: ${ex.getMessage}")
      }
    }
  }

  override def dropTable(dbName: String, tblName: String, tableType: TableType): Future[Boolean] = dropTable(dbName, tblName)

  override def getColumnNames(dbName: String, tblName: String): Future[Set[String]] = {
    Future {
      val table: Table = getTable(dbName, tblName)
      val schema: Schema = table.getDefinition[TableDefinition]().getSchema
      schema.getFields.asScala.map(_.getName).toSet
    }
  }

  override def createDatabase(dbName: String): Future[Boolean] =
    Future {
      try {
        val tempDatabase: DatasetInfo = DatasetInfo.newBuilder(dbName).build()
        val newDatabase: Dataset = bigQuery.create(tempDatabase)
        newDatabase != null
      } catch {
        case ex: Throwable =>
          logger.error(s"$clazz.createDatabase: $dbName", ex)
          throw InternalError(s"Create database failed with error: ${ex.getMessage}")
      }
    }

  override def createTable(tableSchema: TableSchema): Future[Boolean] = {
    Future {
      try {
        val tableId = TableId.of(tableSchema.dbName, tableSchema.name)
        val tableDefinition: TableDefinition = tableSchema.getTableType match {
          case TableType.Default      => toDefaultDefinition(tableSchema)
          case TableType.Materialized => toMaterializedDefinition(tableSchema)
          case TableType.EtlView      => toViewDefinition(tableSchema)
          case TableType.View         => toViewDefinition(tableSchema)
          case _                      => throw InternalError(s"unknown supported table type: ${tableSchema.tableType}")
        }
        val tableInfo = TableInfo.newBuilder(tableId, tableDefinition).build()
        val newTable: Table = bigQuery.create(tableInfo)
        newTable != null
      } catch {
        case ex: Throwable =>
          logger.error(s"$clazz.createTable: $tableSchema", ex)
          throw InternalError(s"Create table failed with error: ${ex.getMessage}")
      }
    }
  }

  private def toDefaultDefinition(tableSchema: TableSchema): TableDefinition = {
    val fields: Seq[Field] = tableSchema.columns.map(column => BigQueryUtils.toField(column))
    val schema: Schema = Schema.of(fields: _*)
    StandardTableDefinition
      .newBuilder()
      .setSchema(schema)
      .setType(TableDefinition.Type.TABLE)
      .build()
  }

  private def toMaterializedDefinition(tableSchema: TableSchema): TableDefinition = {
    MaterializedViewDefinition
      .newBuilder(tableSchema.query.get)
      .build()
  }

  private def toViewDefinition(tableSchema: TableSchema): TableDefinition = {
    ViewDefinition
      .newBuilder(tableSchema.query.get)
      .build()
  }

  override def renameTable(dbName: String, oldTblName: String, newTblName: String): Future[Boolean] = {
    Future {
      try {
        val renameQuery =
          s"""ALTER TABLE `$dbName`.`$oldTblName`
             |RENAME TO `$newTblName`
             |""".stripMargin
        val isSuccess: Boolean = executeUpdate(renameQuery)
        isSuccess
      } catch {
        case ex: Throwable =>
          logger.error(s"$clazz.renameTable: $dbName, $oldTblName, $newTblName", ex)
          throw InternalError(s"Rename table failed with error: ${ex.getMessage}")
      }
    }
  }

  override def addColumn(dbName: String, tblName: String, column: Column): Future[Boolean] = {
    addColumns(dbName, tblName, Seq(column))
  }

  override def addColumns(dbName: String, tblName: String, columns: Seq[Column]): Future[Boolean] = {
    Future {
      try {
        val oldTable: Table = getTable(dbName, tblName)
        val oldDefinition: TableDefinition = oldTable.getDefinition[TableDefinition]
        if (!oldDefinition.isInstanceOf[StandardTableDefinition]) {
          throw InternalError(s"Add column to table ${oldDefinition.getType.name()} is not supported")
        }
        val newSchema: Schema = BigQueryUtils.addColumns(oldDefinition.getSchema, columns)
        val newTable: Table = oldTable.toBuilder.setDefinition(StandardTableDefinition.of(newSchema)).build()
        bigQuery.update(newTable) != null
      } catch {
        case ex: BigQueryException =>
          logger.error(s"$clazz.addColumn: $dbName, $tblName, $columns", ex)
          throw InternalError(s"Add column failed with error: ${ex.getMessage}")
      }
    }
  }

  override def updateColumn(dbName: String, tblName: String, column: Column): Future[Boolean] = {
    Future {
      try {
        val oldTable: Table = getTable(dbName, tblName)
        val oldDefinition: TableDefinition = oldTable.getDefinition[TableDefinition]
        if (!oldDefinition.isInstanceOf[StandardTableDefinition]) {
          throw InternalError(s"Update column to table ${oldDefinition.getType.name()} is not supported")
        }
        val newField: Field = BigQueryUtils.toField(column)
        val oldField: Field = getField(oldDefinition.getSchema, column.name)
        updateDataType(dbName, tblName, column, oldField, newField)
        updateNullable(dbName, tblName, column, oldField, newField)
        true
      } catch {
        case ex: BigQueryException =>
          logger.error(s"$clazz.updateColumn: $dbName, $tblName, $column", ex)
          throw InternalError(s"Update column failed with error: ${ex.getMessage}")
      }
    }
  }

  private def getField(schema: Schema, colName: String): Field = {
    schema.getFields.asScala.find(_.getName == colName) match {
      case Some(field) => field
      case None        => throw NotFoundError(s"Column $colName not found in schema")
    }
  }

  private def updateDataType(
      dbName: String,
      tblName: String,
      column: Column,
      oldField: Field,
      newField: Field
  ): Unit = {
    val isChangeType: Boolean = oldField.getType != newField.getType
    if (isChangeType) {
      val query = s"""ALTER TABLE `$dbName`.`$tblName`
           |ALTER COLUMN `${column.name}`
           |SET DATA TYPE ${newField.getType.name()}
           |""".stripMargin
      executeUpdate(query)
    }
  }

  private def updateNullable(
      dbName: String,
      tblName: String,
      column: Column,
      oldField: Field,
      newField: Field
  ): Unit = {
    val isToNullable: Boolean = oldField.getMode == Field.Mode.REQUIRED && newField.getMode == Field.Mode.NULLABLE
    if (isToNullable) {
      val query = s"""
           |ALTER TABLE `$dbName`.`$tblName`
           |ALTER COLUMN `${column.name}` DROP NOT NULL
           |""".stripMargin
      executeUpdate(query)
    }
  }

  override def dropColumn(dbName: String, tblName: String, columnName: String): Future[Boolean] = {
    Future {
      try {
        val oldTable: Table = getTable(dbName, tblName)
        val oldDefinition: TableDefinition = oldTable.getDefinition[TableDefinition]
        if (!oldDefinition.isInstanceOf[StandardTableDefinition]) {
          throw InternalError(s"Update column to table ${oldDefinition.getType.name()} is not supported")
        }
        val oldField: Field = getField(oldDefinition.getSchema, columnName)
        val dropQuery =
          s"""ALTER TABLE `$dbName`.`$tblName`
           |DROP COLUMN `${oldField.getName}`
           |""".stripMargin
        executeUpdate(dropQuery)
      } catch {
        case ex: BigQueryException =>
          logger.error(s"$clazz.dropColumn: $dbName, $tblName, $columnName", ex)
          throw InternalError(s"Drop column failed with error: ${ex.getMessage}")
      }
    }
  }

  private def getTable(dbName: String, tblName: String): Table = {
    val table = bigQuery.getTable(TableId.of(dbName, tblName))
    if (table == null) {
      throw NotFoundError(s"Table $tblName does not exist in database $dbName")
    }
    table
  }

  private def executeUpdate(query: String): Boolean = {
    val result: Boolean = bigQueryClient.query(query)(_ => true)
    result
  }

  override def migrateDataWithEncryption(
      sourceTable: TableSchema,
      destTable: TableSchema,
      encryptedColumnNames: Seq[String],
      decryptedColumns: Seq[String]
  ): Future[Boolean] = ???

  override def detectColumns(query: String): Future[Seq[Column]] = Future {
    bigQueryClient.detectColumns(query: String)
  }
}
