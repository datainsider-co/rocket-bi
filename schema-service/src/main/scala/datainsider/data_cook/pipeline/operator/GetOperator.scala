package datainsider.data_cook.pipeline.operator

import datainsider.client.domain.Implicits.FutureEnhanceLike
import datainsider.client.domain.query.{Limit, Query, SqlQuery}
import datainsider.client.util.JdbcClient
import datainsider.data_cook.domain.IncrementalConfig
import datainsider.data_cook.domain.operator.TableConfiguration
import datainsider.data_cook.pipeline.exception.OperatorException
import datainsider.data_cook.pipeline.operator.Operator.OperatorId
import datainsider.data_cook.service.table.EtlTableService
import datainsider.ingestion.domain.{Column, TableSchema, TableType}
import datainsider.ingestion.util.Implicits.ImplicitString
import datainsider.profiler.Profiler

import scala.concurrent.ExecutionContext.Implicits.global

case class GetOperator(
    id: OperatorId,
    tableSchema: TableSchema,
    destTableConfiguration: TableConfiguration
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

case class GetOperatorExecutor(tableService: EtlTableService, limit: Option[Limit], client: JdbcClient) extends Executor[GetOperator] {

  private def buildQuery(operator: GetOperator, context: ExecutorContext): (Query, Option[IncrementalConfig]) = {
    val dbName: String = operator.tableSchema.dbName
    val tblName: String = operator.tableSchema.name
    val incrementalConfig: Option[IncrementalConfig] = context.config.getIncrementalConfig(operator.destTableConfiguration)
    val incrementalColumn: Option[Column] = incrementalConfig.flatMap(incrementalConfig => operator.tableSchema.findColumn(incrementalConfig.columnName))
    (incrementalConfig, incrementalColumn) match {
      case (Some(incrementalConfig), Some(column)) => {
        val maxValue: String = getMaxValue(dbName, tblName, column.name)
        val query = SqlQuery(s"""
               |SELECT *
               |FROM `$dbName`.`$tblName`
               |${buildWhereQuery(incrementalConfig, maxValue)}
               |${buildLimitQuery(limit)}
               |""".stripMargin
          )
        (query, Some(incrementalConfig.copy(value = maxValue)))
      }
      case _ => {
          val query = SqlQuery(s"""
               |SELECT *
               |FROM `$dbName`.`$tblName`
               |${buildLimitQuery(limit)}
               |""".stripMargin
          )
        (query, None)
      }
    }
  }

  private def getMaxValue(dbName: String, tblName: String, columnName: String): String = {
    val query = s"""
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
      case None => ""
    }
  }

  private def updateIncrementalConfig(operator: GetOperator, context: ExecutorContext, newIncrementalConfig: Option[IncrementalConfig]) = {
    if (newIncrementalConfig.isDefined) {
      context.config.updateIncrementalConfig(operator.destTableConfiguration, newIncrementalConfig.get)
    }
  }

  @throws[OperatorException]
  override def process(operator: GetOperator, context: ExecutorContext): OperatorResult = Profiler(s"[Executor] ${getClass.getSimpleName}.process"){

    try {
      val (query, newIncrementalConfig) = buildQuery(operator, context)
      val colDisplayNames = operator.tableSchema.getColumnDisplayNames.toArray
      val newTableSchema: TableSchema = tableService
        .creatView(context.orgId, context.jobId, query, operator.destTableConfiguration, TableType.EtlView, colDisplayNames)
        .syncGet()
      updateIncrementalConfig(operator, context, newIncrementalConfig)
      TableResult(operator.id, newTableSchema)
    } catch {
      case ex: Throwable => throw new OperatorException(ex.getMessage, ex)
    }

  }
}
