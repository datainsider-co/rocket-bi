package datainsider.data_cook.pipeline.operator

import com.fasterxml.jackson.module.scala.JsonScalaEnumeration
import com.twitter.util.logging.Logging
import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.util.JdbcClient
import datainsider.data_cook.domain.Ids.OrganizationId
import datainsider.data_cook.domain.persist.PersistentType.PersistentType
import datainsider.data_cook.domain.persist.{PersistentType, PersistentTypeRef}
import datainsider.data_cook.pipeline.exception.InputInvalid
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.ingestion.domain.Types.{DBName, TblName}
import datainsider.ingestion.domain.{TableSchema, TableType}
import datainsider.ingestion.misc.ClickHouseDDLConverter
import datainsider.ingestion.service.SchemaService
import datainsider.ingestion.util.Implicits.ImplicitString
import datainsider.profiler.Profiler
import org.testcontainers.shaded.org.bouncycastle.operator.OperatorException

import scala.collection.mutable
import scala.concurrent.ExecutionContext.Implicits.global

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
    schemaService: SchemaService,
    client: JdbcClient
) extends Executor[SaveDwhOperator]
    with Logging {

  override def process(operator: SaveDwhOperator, context: ExecutorContext): OperatorResult = Profiler(s"[Executor] ${getClass.getSimpleName}.process") {

    ensureInput(operator, context.mapResults)
    val tableSchema: TableSchema = context.mapResults(operator.parentIds.head).getData[TableSchema]().get
    val insertedRows: Long = operator.`type` match {
      case PersistentType.Replace => replaceTableData(context.orgId, tableSchema, operator)
      case PersistentType.Append => {
        val isTableExisted: Boolean = schemaService.isTableExists(context.orgId, operator.dbName, operator.tblName).syncGet()
        if (isTableExisted) {
          appendTableData(context.orgId, tableSchema, operator)
        } else {
          replaceTableData(context.orgId, tableSchema, operator)
        }
      }
    }
    SaveDwhResult(operator.id, insertedRows, totalRows = insertedRows)
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

  def migrateToOldTableIfExisted(
      organizationId: OrganizationId,
      dbName: DBName,
      tblName: TblName
  ): Unit = {
    val isTableExisted = schemaService.isTableExists(organizationId, dbName, tblName).syncGet()
    if (isTableExisted) {
      schemaService.renameTableSchema(organizationId, dbName, tblName, TableSchema.buildOldTblName(tblName)).syncGet()
    }
  }

  @throws[OperatorException]
  private def replaceTableData(
      organizationId: OrganizationId,
      fromTable: TableSchema,
      operator: SaveDwhOperator
  ): Long = {
    try {
      val destTable: TableSchema = fromTable.copy(
        dbName = operator.dbName,
        name = operator.tblName,
        organizationId = organizationId,
        displayName = operator.displayName.getOrElse(operator.tblName),
        query = None,
        tableType = Some(TableType.Default)
      )
      schemaService.ensureDatabaseCreated(organizationId, destTable.dbName, Some(destTable.dbName.asPrettyDisplayName)).syncGet()

      val tempTableSchema = destTable.copy(name = TableSchema.buildTemporaryTblName(operator.tblName))
      migrateToOldTableIfExisted(organizationId, operator.dbName, operator.tblName)
      schemaService.createTableSchema(tempTableSchema).syncGet()
      schemaService.renameTableSchema(organizationId, tempTableSchema.dbName, tempTableSchema.name, destTable.name).syncGet()
      ingest(fromTable, destTable)
    } catch {
      case ex: Throwable => throw new OperatorException(s"exception when replace table data, cause ${ex.getMessage}", ex)
    }
  }

  @throws[InputInvalid]
  @throws[OperatorException]
  private def appendTableData(
      organizationId: OrganizationId,
      sourceTable: TableSchema,
      operator: SaveDwhOperator
  ): Long = {
    try {
      val destTable: TableSchema = schemaService.getTableSchema(operator.dbName, operator.tblName).syncGet()
      ensureCompatibleSchema(sourceTable, destTable)
      ingest(sourceTable, destTable)
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

  private def ingest(fromTable: TableSchema, destTable: TableSchema): Long = {
    val queryInsert: String = ClickHouseDDLConverter().toInsertFromTable(
      fromTable.dbName,
      fromTable.name,
      destTable.dbName,
      destTable.name,
      fromTable.columns
    )
    logger.info(s"ingest::with queryInsert insert ${queryInsert}")
    client.executeUpdate(queryInsert)
  }

}

case class TestSaveDwhOperatorExecutor() extends Executor[SaveDwhOperator] {

  override def process(operator: SaveDwhOperator, context: ExecutorContext): OperatorResult = {

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
