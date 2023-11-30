package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.client.JdbcClient.Record
import co.datainsider.bi.domain.Connection
import co.datainsider.bi.domain.query.{ObjectQueryBuilder, QueryParserImpl, Select, TableField}
import co.datainsider.bi.engine.factory.EngineResolver
import co.datainsider.bi.engine.{DataStream, Engine}
import co.datainsider.bi.service.ConnectionService
import co.datainsider.bi.util.Implicits.ImplicitString
import co.datainsider.bi.util.Using
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.datacook.domain.Ids.OrganizationId
import co.datainsider.datacook.domain.persist.PersistentType.PersistentType
import co.datainsider.datacook.domain.persist.{PersistentType, PersistentTypeRef}
import co.datainsider.datacook.pipeline.exception.InputInvalid
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.datacook.pipeline.operator.persist.InsertResult
import co.datainsider.schema.domain.column.Column
import co.datainsider.schema.domain.{TableSchema, TableType}
import co.datainsider.schema.service.SchemaService
import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import org.testcontainers.shaded.org.bouncycastle.operator.OperatorException

import scala.collection.mutable
import scala.collection.mutable.ArrayBuffer

case class SaveDwhOperator(
    id: OperatorId,
    dbName: String,
    tblName: String,
    @JsonScalaEnumeration(classOf[PersistentTypeRef]) `type`: PersistentType,
    displayName: Option[String] = None
) extends Operator

case class SaveDwhResult(id: OperatorId, insertedRows: Long, totalRows: Long) extends OperatorResult {

  override def getData[T]()(implicit manifest: Manifest[T]): Option[T] = None

  override def toString: String = {
    s"SaveDwhResult: ${insertedRows} inserted rows, ${totalRows} total rows"
  }
}

case class SaveDwhOperatorExecutor(
    engineResolver: EngineResolver,
    connectionService: ConnectionService,
    schemaService: SchemaService,
    batchSize: Int = 100000
) extends Executor[SaveDwhOperator]
    with Logging {

  override def execute(operator: SaveDwhOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

      ensureInput(operator, context.mapResults)
      val tableSchema: TableSchema = context.mapResults(operator.parentIds.head).getData[TableSchema]().get
      val insertResult: InsertResult = operator.`type` match {
        case PersistentType.Replace => replaceTableData(context.orgId, tableSchema, operator)
        case PersistentType.Append => {
          val isTableExisted: Boolean =
            schemaService.isTableExists(context.orgId, operator.dbName, operator.tblName).syncGet()
          if (isTableExisted) {
            appendTableData(context.orgId, tableSchema, operator)
          } else {
            replaceTableData(context.orgId, tableSchema, operator)
          }
        }
      }
      SaveDwhResult(id = operator.id, insertedRows = insertResult.insertedRows, totalRows = insertResult.totalRows)
    }

  @throws[InputInvalid]
  private def ensureInput(operator: SaveDwhOperator, mapResults: mutable.Map[OperatorId, OperatorResult]): Unit = {

    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for save to data warehouse operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing input for save to data warehouse operator")
    }

  }

  private def moveToTrash(
      organizationId: OrganizationId,
      dbName: String,
      tblName: String
  ): Unit = {
    try {
      schemaService
        .renameTableSchema(organizationId, dbName, tblName, TableSchema.buildOldTblName(tblName))
        .syncGet()
    } catch {
      case ex: Throwable => {
        logger.warn(s"failed to migrate table ${dbName}.${tblName} to old table", ex)
      }
    }
  }

  @throws[OperatorException]
  private def replaceTableData(
      organizationId: OrganizationId,
      fromTable: TableSchema,
      operator: SaveDwhOperator
  ): InsertResult = {
    val destTable: TableSchema = fromTable.copy(
      dbName = operator.dbName,
      name = operator.tblName,
      organizationId = organizationId,
      displayName = operator.displayName.getOrElse(operator.tblName),
      query = None,
      tableType = Some(TableType.Default)
    )
    val tempTable: TableSchema = destTable.copy(name = TableSchema.buildTemporaryTblName(operator.tblName))
    try {
      ensureTableCreated(organizationId, tempTable)
      val result: InsertResult = writeToTable(organizationId, fromTable, tempTable)
      markDestTable(organizationId, tempTable, destTable)
      result
    } catch {
      case ex: Throwable => {
        // clean up temporary table if any exception happened
        moveToTrash(organizationId, tempTable.dbName, tempTable.name)
        throw new OperatorException(s"exception when replace table data, cause ${ex.getMessage}", ex)
      }
    }
  }

  private def writeToTable(
      organizationId: OrganizationId,
      fromTable: TableSchema,
      destTable: TableSchema
  ): InsertResult = {
    val connection: Connection = connectionService.getTunnelConnection(organizationId).syncGet()
    val engine: Engine[Connection] = engineResolver.resolve(connection.getClass).asInstanceOf[Engine[Connection]]
    var insertedRows: Long = 0L
    val totalRows = Using(engine.createWriter(connection))(writer => {
      getData(
        connection = connection,
        engine = engine,
        fromTable = fromTable,
        destTable = destTable,
        batchSize = batchSize,
        resultFn = (records: Seq[Record]) => {
          insertedRows += writer.insertBatch(records, destTable)
        }
      )
    })
    InsertResult(totalRows = totalRows, insertedRows = insertedRows)
  }

  private def ensureTableCreated(organizationId: OrganizationId, tableSchema: TableSchema): Unit = {
    schemaService
      .ensureDatabaseCreated(
        organizationId = organizationId,
        name = tableSchema.dbName,
        displayName = Some(tableSchema.dbName.asPrettyDisplayName)
      )
      .syncGet()
    schemaService.createTableSchema(tableSchema).syncGet()
  }

  private def markDestTable(
      organizationId: OrganizationId,
      temporaryTable: TableSchema,
      destTable: TableSchema
  ): Unit = {
    moveToTrash(organizationId, destTable.dbName, destTable.name)
    schemaService
      .renameTableSchema(
        organizationId = organizationId,
        dbName = temporaryTable.dbName,
        tblName = temporaryTable.name,
        newTblName = destTable.name
      )
      .syncGet()
  }

  @throws[InputInvalid]
  @throws[OperatorException]
  private def appendTableData(
      organizationId: OrganizationId,
      sourceTable: TableSchema,
      operator: SaveDwhOperator
  ): InsertResult = {
    try {
      val destTable: TableSchema = schemaService.getTableSchema(operator.dbName, operator.tblName).syncGet()
      ensureCompatibleSchema(sourceTable, destTable)
      writeToTable(organizationId, sourceTable, destTable)
    } catch {
      case ex: Throwable => throw new OperatorException(s"exception when append data ${ex.getMessage}", ex)
    }
  }

  @throws[InputInvalid]
  private def ensureCompatibleSchema(sourceTable: TableSchema, destTable: TableSchema): Unit = {
    val sourceTblNames: Set[String] = sourceTable.columns.map(column => column.name).toSet
    val destTblNames: Set[String] = destTable.columns.map(column => column.name).toSet
    val isIncompatible: Boolean = sourceTblNames.diff(destTblNames).nonEmpty
    if (isIncompatible) {
      throw InputInvalid(
        s"Table destination ${destTable.dbName}.${destTable.name} incompatible with ${sourceTable.dbName}.${sourceTable.name}"
      )
    }
  }

  private def getData(
      engine: Engine[Connection],
      connection: Connection,
      fromTable: TableSchema,
      destTable: TableSchema,
      batchSize: Int,
      resultFn: (Seq[Record]) => Unit
  ): Long = {
    var totalRows: Long = 0
    val selectQuery: String = parseToQuery(engine, fromTable)
    engine.executeAsDataStream(connection, selectQuery)((dataStream: DataStream) => {
      val destIndexes: Array[Int] = indexedColumns(destTable, dataStream.columns)

      var buffers = ArrayBuffer.empty[Record]
      while (dataStream.stream.hasNext) {
        val record: Record = dataStream.stream.next()
        val newRecord = destIndexes.map(index => record.lift(index).orNull)
        buffers += newRecord
        if (buffers.size > batchSize) {
          resultFn(buffers)
          totalRows += buffers.size
          buffers = ArrayBuffer.empty[Record]
        }
      }
      // empty
      if (buffers.nonEmpty) {
        resultFn(buffers)
        totalRows += buffers.size
      }
    })
    totalRows
  }

  private def parseToQuery(engine: Engine[Connection], table: TableSchema): String = {
    val queryParser = new QueryParserImpl(engine.getSqlParser())
    val builder = new ObjectQueryBuilder()
    table.columns.foreach(col => {
      builder.addFunction(
        Select(
          field = new TableField(
            dbName = table.dbName,
            tblName = table.name,
            fieldName = col.name,
            fieldType = col.getColumnType
          ),
          aliasName = Some(col.name)
        )
      )
    })
    queryParser.parse(builder.build())
  }

  /**
    * indexed destination columns in source table, if not found, return -1
    */
  private def indexedColumns(destTable: TableSchema, fromColumns: Seq[Column]): Array[Int] = {
    val fromColumnIndexMap: Map[String, Int] = fromColumns.map(_.name).zipWithIndex.toMap
    destTable.columns.map(column => fromColumnIndexMap.getOrElse(column.name, -1)).toArray
  }
}
case class MockSaveDwhOperatorExecutor() extends Executor[SaveDwhOperator] {

  override def execute(operator: SaveDwhOperator, context: ExecutorContext): OperatorResult = {

    ensureInput(operator, context.mapResults)
    SaveDwhResult(operator.id, 0, 0)

  }

  @throws[InputInvalid]
  private def ensureInput(operator: SaveDwhOperator, mapResults: mutable.Map[OperatorId, OperatorResult]): Unit = {

    if (operator.parentIds.size != 1) {
      throw InputInvalid("only take one input for save to data warehouse operator")
    }

    val parentTable: Option[TableSchema] = mapResults.get(operator.parentIds.head).flatMap(_.getData[TableSchema]())
    if (parentTable.isEmpty) {
      throw InputInvalid("missing input for save to data warehouse operator")
    }

  }
}
