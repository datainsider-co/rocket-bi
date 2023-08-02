package co.datainsider.datacook.pipeline.operator

import co.datainsider.bi.client.JdbcClient
import co.datainsider.bi.domain.query.{Limit, Query, SqlQuery}
import co.datainsider.bi.util.Implicits.ImplicitString
import co.datainsider.bi.util.profiler.Profiler
import co.datainsider.caas.user_profile.domain.Implicits.FutureEnhanceLike
import co.datainsider.datacook.domain.IncrementalConfig
import co.datainsider.datacook.domain.operator.DestTableConfig
import co.datainsider.datacook.pipeline.exception.OperatorException
import co.datainsider.datacook.pipeline.operator.Operator.OperatorId
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
    client: JdbcClient,
    operatorService: OperatorService,
    limit: Option[Limit] = None
) extends Executor[GetOperator] {

  @throws[OperatorException]
  override def execute(operator: GetOperator, context: ExecutorContext): OperatorResult =
    Profiler(s"[Executor] ${getClass.getSimpleName}.execute") {
      try {
        val tableSchema: TableSchema =
          getTableSchema(context.orgId, operator.tableSchema.dbName, operator.tableSchema.name)
        val (query, newIncrementalConfig) = buildQuery(operator, tableSchema.columns, context)
        val colDisplayNames: Array[String] = tableSchema.getColumnDisplayNames.toArray
        val newTableSchema: TableSchema = operatorService
          .createViewTable(
            context.orgId,
            context.jobId,
            query,
            operator.destTableConfiguration,
            colDisplayNames
          )
          .syncGet()
        updateIncrementalConfig(operator, context, newIncrementalConfig)
        TableResult(operator.id, newTableSchema)
      } catch {
        case ex: Throwable => throw new OperatorException(ex.getMessage, ex)
      }

    }

  private def buildQuery(
      operator: GetOperator,
      columns: Seq[Column],
      context: ExecutorContext
  ): (Query, Option[IncrementalConfig]) = {
    val dbName: String = operator.tableSchema.dbName
    val tblName: String = operator.tableSchema.name
    val allColumnQuery: String = columns.map(column => column.name.escape).mkString(", ")
    val incrementalConfig: Option[IncrementalConfig] =
      context.config.getIncrementalConfig(operator.destTableConfiguration)
    val incrementalColumn: Option[Column] =
      incrementalConfig.flatMap(incrementalConfig => operator.tableSchema.findColumn(incrementalConfig.columnName))
    (incrementalConfig, incrementalColumn) match {
      case (Some(incrementalConfig), Some(column)) => {
        val maxValue: String = getMaxValue(dbName, tblName, column.name)
        val query = SqlQuery(s"""
             |SELECT $allColumnQuery
             |FROM `$dbName`.`$tblName`
             |${buildWhereQuery(incrementalConfig, maxValue)}
             |${buildLimitQuery(limit)}
             |""".stripMargin)
        (query, Some(incrementalConfig.copy(value = maxValue)))
      }
      case _ => {
        val query = SqlQuery(s"""
             |SELECT $allColumnQuery
             |FROM `$dbName`.`$tblName`
             |${buildLimitQuery(limit)}
             |""".stripMargin)
        (query, None)
      }
    }
  }

  private def getTableSchema(orgId: Long, dbName: String, tblName: String): TableSchema = {
    operatorService.getTableSchema(orgId, dbName, tblName).syncGet()
  }

  private def getMaxValue(dbName: String, tblName: String, columnName: String): String = {
    val query =
      s"""
         |SELECT MAX(`$columnName`)
         |FROM `$dbName`.`$tblName`
         |""".stripMargin

    client.executeQuery(query)(rs => {
      if (rs.next()) {
        rs.getString(1)
      } else {
        ""
      }
    })
  }

  private def buildWhereQuery(incrementalConfig: IncrementalConfig, maxValue: String): String = {
    val minCondition = if (incrementalConfig.value.nonEmpty) {
      s"${incrementalConfig.columnName} > '${incrementalConfig.value}'"
    } else {
      ""
    }
    val maxCondition = s"${incrementalConfig.columnName} <= '${maxValue}'"
    val whereQuery: String = Seq(minCondition, maxCondition).filter(_.nonEmpty).mkString("WHERE ", " AND ", "")
    whereQuery
  }

  private def buildLimitQuery(limit: Option[Limit]): String = {
    limit match {
      case Some(limit) => s"LIMIT ${limit.offset}, ${limit.size}"
      case None        => ""
    }
  }

  private def updateIncrementalConfig(
      operator: GetOperator,
      context: ExecutorContext,
      newIncrementalConfig: Option[IncrementalConfig]
  ) = {
    if (newIncrementalConfig.isDefined) {
      context.config.updateIncrementalConfig(operator.destTableConfiguration, newIncrementalConfig.get)
    }
  }
}
