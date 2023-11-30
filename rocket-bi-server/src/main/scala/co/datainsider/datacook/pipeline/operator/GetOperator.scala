package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.domain.query.{And, Function, GreaterThanOrEqual, LessThan, Limit, ObjectQueryBuilder, Query, Select, TableField}
import co.datainsider.bi.util.TimeUtils
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.datacook.domain.IncrementalConfig
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.pipeline.exception.OperatorException
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
import co.datainsider.jobworker.util.DateTimeUtils
import co.datainsider.schema.domain.TableSchema
import co.datainsider.schema.domain.column.Column

case class GetOperator(
    id: OperatorId,
    @deprecated("don't use columns in this field, cause table schema can be changed")
    tableSchema: TableSchema,
    destTableConfiguration: DestTableConfig
) extends TableResultOperator

case class TableResult(id: OperatorId, tableSchema: TableSchema) extends OperatorResult {

  override def getData[T]()(implicit manifest: Manifest[T]): Option[T] = {
    if (manifest.runtimeClass == classOf[TableSchema]) {
      Some(tableSchema.asInstanceOf[T])
    } else {
      None
    }
  }

  override def toString: String = {
    s"TableResult ${tableSchema.name}: ${tableSchema.columns.size} columns, table type: ${tableSchema.tableType}"
  }

}

case class GetOperatorExecutor(
    operatorService: OperatorService,
    limit: Option[Limit] = None
) extends Executor[GetOperator] {

  @throws[OperatorException]
  override def execute(operator: GetOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.execute") {
      try {
        val tableSchema: TableSchema = operatorService
          .getTableSchema(
            organizationId = context.orgId,
            dbName = operator.tableSchema.dbName,
            tblName = operator.tableSchema.name
          )
          .syncGet()
        val (query, incrementalConfig) = buildQuery(operator, context, tableSchema)
        val newTableSchema: TableSchema = operatorService
          .createViewTable(
            organizationId = context.orgId,
            id = context.jobId,
            query = query,
            config = operator.destTableConfiguration
          )
          .syncGet()
        updateIncrementalConfig(operator, context, incrementalConfig)
        TableResult(operator.id, newTableSchema)
      } catch {
        case ex: Throwable => throw new OperatorException(ex.getMessage, ex)
      }

    }

  private def buildQuery(
      operator: GetOperator,
      context: ExecutorContext,
      tableSchema: TableSchema
  ): (Query, Option[IncrementalConfig]) = {
    val incrementalConfig: Option[IncrementalConfig] =
      context.config.getIncrementalConfig(operator.destTableConfiguration)
    val incrementalColumn: Option[Column] =
      incrementalConfig.flatMap(incrementalConfig => operator.tableSchema.findColumn(incrementalConfig.columnName))
    (incrementalConfig, incrementalColumn) match {
      case (Some(incrementalConfig), Some(column)) => {
        buildIncrementalQuery(
          operator = operator,
          context = context,
          tableSchema = tableSchema,
          incrementalConfig = incrementalConfig,
          incrementalColumn = column
        )
      }
      case _ => {
        val query: Query = buildFullQuery(operator, tableSchema)
        (query, None)
      }
    }
  }

  private def buildIncrementalQuery(
      operator: GetOperator,
      context: ExecutorContext,
      tableSchema: TableSchema,
      incrementalConfig: IncrementalConfig,
      incrementalColumn: Column
  ): (Query, Option[IncrementalConfig]) = {
    val upperBound = GreaterThanOrEqual(
      field = TableField(
        dbName = tableSchema.dbName,
        tblName = tableSchema.name,
        fieldName = incrementalColumn.name,
        fieldType = incrementalColumn.getColumnType
      ),
      value = incrementalConfig.value
    )
    val maxValue: String = operatorService.getMaxValue(context.orgId, tableSchema.dbName, tableSchema.name, incrementalColumn.name, incrementalColumn.getColumnType).syncGet()
    val lowerBound = LessThan(
      field = TableField(
        dbName = tableSchema.dbName,
        tblName = tableSchema.name,
        fieldName = incrementalColumn.name,
        fieldType = incrementalColumn.getColumnType
      ),
      value = maxValue
    )

    val query: Query = buildFullQuery(operator, tableSchema)
    val newIncrementalConfig: IncrementalConfig = incrementalConfig.copy(value = maxValue)
    if (incrementalConfig.value == null || incrementalConfig.value.isEmpty) {
      (query.addCondition(lowerBound), Some(newIncrementalConfig))
    } else {
      (query.addCondition(And(Array(upperBound, lowerBound))), Some(newIncrementalConfig))
    }
  }

  private def buildFullQuery(operator: GetOperator, tableSchema: TableSchema): Query = {
    val builder: ObjectQueryBuilder = new ObjectQueryBuilder()
    val selectColumnFnList: Array[Function] = tableSchema.columns
      .map(col => {
        Select(
          field = TableField(
            dbName = tableSchema.dbName,
            tblName = tableSchema.name,
            fieldName = col.name,
            fieldType = col.getColumnType
          ),
          aliasName = Some(col.displayName)
        )
      })
      .toArray
    builder.addFunctions(selectColumnFnList)
    builder.setLimit(limit)
    builder.build()
  }

  private def updateIncrementalConfig(
      operator: GetOperator,
      context: ExecutorContext,
      newIncrementalConfig: Option[IncrementalConfig]
  ): Unit = {
    if (newIncrementalConfig.isDefined) {
      context.config.updateIncrementalConfig(operator.destTableConfiguration, newIncrementalConfig.get)
    }
  }
}
